"use server"

import type { FileMeta, ReviewChunk } from "@/lib/types"
import { config } from "@/lib/config"
import { listChangedFiles, getFileContent, getPullRequest } from "@/actions/azure-devops"
import { createPatch } from 'diff'

export async function prepareReviewData(
    repoId: string,
    prId: string,
    selectedFilePaths: string[]
): Promise<FileMeta[]> {
    const pr = await getPullRequest(repoId, prId);
    if (!pr) throw new Error("Could not get pull request details");
    
    const allChangedFiles = await listChangedFiles(repoId, prId);
    const selectedFiles = allChangedFiles.filter(f => selectedFilePaths.includes(f.item.path));

    const sourceBranch = pr.sourceRefName.replace('refs/heads/', '');
    const targetBranch = pr.targetRefName.replace('refs/heads/', '');

    const fileDetails: FileMeta[] = [];

    for (const file of selectedFiles) {
        let oldContent = "";
        let newContent = "";
        
        const pathForContent = file.item.path.startsWith('/') ? file.item.path.substring(1) : file.item.path;

        switch (file.changeType) {
            case 'add':
                newContent = await getFileContent(repoId, pathForContent, sourceBranch, 'branch');
                break;
            case 'delete':
                oldContent = await getFileContent(repoId, pathForContent, targetBranch, 'branch');
                break;
            case 'edit':
                oldContent = await getFileContent(repoId, pathForContent, targetBranch, 'branch');
                newContent = await getFileContent(repoId, pathForContent, sourceBranch, 'branch');
                break;
        }

        const patch = createPatch(
            file.item.path, 
            oldContent, 
            newContent,
            `branch ${targetBranch}`,
            `branch ${sourceBranch}`
        );

        fileDetails.push({
            path: file.item.path,
            language: file.item.path.split(".").pop() || "text",
            diff: patch,
            fullText: newContent,
        });
    }

    return fileDetails;
}

export async function getFileDiff(
  repoId: string,
  prId: string,
  filePath: string,
  changeType: "add" | "edit" | "delete"
): Promise<{ oldContent: string; newContent: string }> {
  const pr = await getPullRequest(repoId, prId)
  if (!pr) throw new Error("Could not get pull request details")

  const sourceBranch = pr.sourceRefName.replace("refs/heads/", "")
  const targetBranch = pr.targetRefName.replace("refs/heads/", "")
  const pathForContent = filePath.startsWith("/")
    ? filePath.substring(1)
    : filePath

  let oldContent = ""
  let newContent = ""

  switch (changeType) {
    case "add":
      newContent = await getFileContent(
        repoId,
        pathForContent,
        sourceBranch,
        "branch"
      )
      break
    case "delete":
      oldContent = await getFileContent(
        repoId,
        pathForContent,
        targetBranch,
        "branch"
      )
      break
    case "edit":
      oldContent = await getFileContent(
        repoId,
        pathForContent,
        targetBranch,
        "branch"
      )
      newContent = await getFileContent(
        repoId,
        pathForContent,
        sourceBranch,
        "branch"
      )
      break
  }

  return { oldContent, newContent }
}

export async function reviewFiles(files: FileMeta[], prContext?: string): Promise<{ success: boolean; message: string; reviews: ReviewChunk[] }> {
  if (files.length === 0) {
    throw new Error('No files provided for review')
  }

  if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  try {
    // Create a comprehensive prompt for code review
    const prompt = createReviewPrompt(files, prContext)
    console.log("OpenAI Review Prompt:", prompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert code reviewer. Analyze the provided code changes and provide detailed feedback. 
            Focus on:
            - Security vulnerabilities
            - Performance issues
            - Code quality and maintainability
            - Best practices
            - Potential bugs
            
            Provide feedback in JSON format with the following structure:
            {
              "file": "file path",
              "severity": "BLOCKER|MAJOR|MINOR|NIT",
              "message": "detailed feedback message"
            }
            
            Be specific, actionable, and constructive in your feedback.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Parse the review chunks from the response
    const reviewChunks = parseReviewChunks(content, files)
    
    // For now, we'll return a simple success response
    // In a real implementation, you might want to store the review results in a database
    // and return a session ID that can be used to fetch the results
    
    return {
      success: true,
      message: `Review completed for ${files.length} files with ${reviewChunks.length} feedback items`,
      reviews: reviewChunks
    }
  } catch (error) {
    console.error('Review error:', error)
    return {
      success: false,
      message: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      reviews: []
    }
  }
}

function createReviewPrompt(files: FileMeta[], prContext?: string): string {
  let prompt = ''
  
  // Add PR context if provided
  if (prContext && prContext.trim()) {
    prompt += `PR Context:\n${prContext.trim()}\n\n`
  }
  
  prompt += 'Please review the following code changes:\n\n'
  
  for (const file of files) {
    prompt += `File: ${file.path}\n`
    prompt += `Language: ${file.language}\n`
    prompt += `Diff:\n${file.diff}\n`
    prompt += `Full Content:\n${file.fullText}\n`
    prompt += '---\n\n'
  }
  
  prompt += 'Please provide a comprehensive code review focusing on security, performance, and code quality.'
  
  return prompt
}

function parseReviewChunks(content: string, files: FileMeta[]): ReviewChunk[] {
  const chunks: ReviewChunk[] = []
  
  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        file: item.file || files[0]?.path || 'unknown',
        severity: item.severity || 'MINOR',
        message: item.message || 'Review feedback'
      }))
    }
    
    // Try to parse as single JSON object
    if (parsed.file && parsed.message) {
      return [{
        file: parsed.file,
        severity: parsed.severity || 'MINOR',
        message: parsed.message
      }]
    }
  } catch (e) {
    // If JSON parsing fails, treat as plain text
    if (content.trim()) {
      chunks.push({
        file: files[0]?.path || 'unknown',
        severity: 'MINOR',
        message: content.trim()
      })
    }
  }
  
  return chunks
}
