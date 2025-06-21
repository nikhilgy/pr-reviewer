"use server"

import type { Repo, PullRequest, FileChange } from "@/lib/types"
import { config } from "@/lib/config"
import { createSafeObject } from "@/lib/serialization"

// Azure DevOps API configuration
const BASE_URL = `https://dev.azure.com/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis`

// Create authorization header
const createAuthHeader = () => {
  if (!config.azureDevOps.pat || config.azureDevOps.pat === 'your-pat') {
    throw new Error('Azure DevOps PAT not configured. Please set AZURE_DEVOPS_PAT environment variable.')
  }
  
  const credentials = Buffer.from(`:${config.azureDevOps.pat}`).toString('base64')
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// Generic API call function
async function azureDevOpsApiCall<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const headers = createAuthHeader()
  const url = new URL(`${BASE_URL}${endpoint}`)
  
  // Add default API version
  if (!params['api-version']) {
    params['api-version'] = '7.0'
  }
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })
  
  const response = await fetch(url.toString(), {
    headers,
    cache: 'no-store' // Disable caching for real-time data
  })
  
  if (!response.ok) {
    throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export async function listRepositories(): Promise<Repo[]> {
  try {
    const data = await azureDevOpsApiCall<{ value: any[] }>('/git/repositories')
    
    const repos = data.value.map(repo => ({
      id: String(repo.id),
      name: String(repo.name),
      url: String(repo.url),
      project: {
        id: String(repo.project?.id || ''),
        name: String(repo.project?.name || '')
      },
      defaultBranch: String(repo.defaultBranch || 'refs/heads/main'),
      size: Number(repo.size || 0),
      remoteUrl: String(repo.remoteUrl || ''),
      sshUrl: String(repo.sshUrl || ''),
      webUrl: String(repo.webUrl || ''),
      lastUpdateTime: String(repo.lastUpdateTime || new Date().toISOString())
    }))
    
    return createSafeObject(repos)
  } catch (error) {
    console.error('Failed to fetch repositories:', error)
    throw new Error('Failed to fetch repositories from Azure DevOps')
  }
}

export async function listPullRequests(repoId: string): Promise<PullRequest[]> {
  try {
    const data = await azureDevOpsApiCall<{ value: any[] }>(`/git/repositories/${repoId}/pullrequests`, {
      'searchCriteria.status': 'active',
      '$top': '100'
    })
    
    const prs = data.value.map(pr => ({
      pullRequestId: Number(pr.pullRequestId),
      codeReviewId: Number(pr.codeReviewId),
      status: (String(pr.status) as 'active' | 'abandoned' | 'completed'),
      createdBy: {
        displayName: String(pr.createdBy?.displayName || ''),
        url: String(pr.createdBy?.url || ''),
        id: String(pr.createdBy?.id || ''),
        uniqueName: String(pr.createdBy?.uniqueName || ''),
        imageUrl: String(pr.createdBy?.imageUrl || '')
      },
      creationDate: String(pr.creationDate),
      title: String(pr.title),
      description: String(pr.description || ''),
      sourceRefName: String(pr.sourceRefName),
      targetRefName: String(pr.targetRefName),
      mergeStatus: String(pr.mergeStatus || ''),
      isDraft: Boolean(pr.isDraft || false),
      mergeId: String(pr.mergeId || ''),
      lastMergeSourceCommit: {
        commitId: String(pr.lastMergeSourceCommit?.commitId || ''),
        url: String(pr.lastMergeSourceCommit?.url || '')
      },
      lastMergeTargetCommit: {
        commitId: String(pr.lastMergeTargetCommit?.commitId || ''),
        url: String(pr.lastMergeTargetCommit?.url || '')
      },
      reviewers: (pr.reviewers || []).map((reviewer: any) => ({
        reviewerUrl: String(reviewer.reviewerUrl || ''),
        vote: Number(reviewer.vote || 0),
        displayName: String(reviewer.displayName || ''),
        imageUrl: String(reviewer.imageUrl || ''),
        uniqueName: String(reviewer.uniqueName || ''),
        id: String(reviewer.id || '')
      })),
      url: String(pr.url)
    }))
    
    return createSafeObject(prs)
  } catch (error) {
    console.error('Failed to fetch pull requests:', error)
    throw new Error('Failed to fetch pull requests from Azure DevOps')
  }
}

export async function getPullRequest(repoId: string, prId: string): Promise<PullRequest | null> {
  try {
    const pr = await azureDevOpsApiCall<any>(`/git/repositories/${repoId}/pullrequests/${prId}`);
    
    const result: PullRequest = {
      pullRequestId: Number(pr.pullRequestId),
      codeReviewId: Number(pr.codeReviewId),
      status: (String(pr.status) as 'active' | 'abandoned' | 'completed'),
      createdBy: {
        displayName: String(pr.createdBy?.displayName || ''),
        url: String(pr.createdBy?.url || ''),
        id: String(pr.createdBy?.id || ''),
        uniqueName: String(pr.createdBy?.uniqueName || ''),
        imageUrl: String(pr.createdBy?.imageUrl || '')
      },
      creationDate: String(pr.creationDate),
      title: String(pr.title),
      description: String(pr.description || ''),
      sourceRefName: String(pr.sourceRefName),
      targetRefName: String(pr.targetRefName),
      mergeStatus: String(pr.mergeStatus || ''),
      isDraft: Boolean(pr.isDraft || false),
      mergeId: String(pr.mergeId || ''),
      lastMergeSourceCommit: {
        commitId: String(pr.lastMergeSourceCommit?.commitId || ''),
        url: String(pr.lastMergeSourceCommit?.url || '')
      },
      lastMergeTargetCommit: {
        commitId: String(pr.lastMergeTargetCommit?.commitId || ''),
        url: String(pr.lastMergeTargetCommit?.url || '')
      },
      reviewers: (pr.reviewers || []).map((reviewer: any) => ({
        reviewerUrl: String(reviewer.reviewerUrl || ''),
        vote: Number(reviewer.vote || 0),
        displayName: String(reviewer.displayName || ''),
        imageUrl: String(reviewer.imageUrl || ''),
        uniqueName: String(reviewer.uniqueName || ''),
        id: String(reviewer.id || '')
      })),
      url: String(pr.url)
    };
    
    return createSafeObject(result);
  } catch (error) {
    console.error(`Failed to fetch pull request ${prId}:`, error);
    return null;
  }
}

export async function getLatestPrIteration(repoId: string, prId: string): Promise<any | null> {
    try {
        const iterationsData = await azureDevOpsApiCall<{ value: any[] }>(`/git/repositories/${repoId}/pullrequests/${prId}/iterations`);
        if (!iterationsData.value || iterationsData.value.length === 0) {
            return null;
        }
        // The last iteration is the most recent
        const latestIterationId = iterationsData.value[iterationsData.value.length - 1].id;
        
        const iterationDetails = await azureDevOpsApiCall<any>(`/git/repositories/${repoId}/pullrequests/${prId}/iterations/${latestIterationId}`);

        return createSafeObject(iterationDetails);

    } catch (error) {
        console.error(`Failed to fetch latest iteration for PR ${prId}:`, error);
        return null;
    }
}

export async function getFileContent(repoId: string, path: string, version?: string, versionType: 'branch' | 'commit' = 'commit'): Promise<string> {
    const headers = createAuthHeader();
    headers['Accept'] = 'text/plain';

    const url = new URL(`${BASE_URL}/git/repositories/${repoId}/items`);
    url.searchParams.append('path', path);
    url.searchParams.append('api-version', '7.0');
    if (version) {
        url.searchParams.append('versionDescriptor.versionType', versionType);
        url.searchParams.append('versionDescriptor.version', version);
    }
    
    try {
        const response = await fetch(url.toString(), {
            headers,
            cache: 'no-store'
        });

        if (!response.ok) {
            if (response.status === 404) {
                return ""; // File not found at this commit.
            }
            const errorText = await response.text();
            console.error(`Azure DevOps API error getting file content for ${path}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Azure DevOps API error getting file content: ${response.status} ${response.statusText}`)
        }

        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch content for ${path}:`, error);
        return ""; // Return empty string on failure
    }
}

export async function listChangedFiles(repoId: string, prId: string): Promise<FileChange[]> {
  try {
    // First get PR iterations to find the latest one
    const iterationsData = await azureDevOpsApiCall<{ value: any[] }>(`/git/repositories/${repoId}/pullrequests/${prId}/iterations`)
    
    if (!iterationsData.value || iterationsData.value.length === 0) {
      return []
    }
    
    // Get files from the latest iteration
    const latestIteration = iterationsData.value[iterationsData.value.length - 1].id
    const changesData = await azureDevOpsApiCall<{ changeEntries: any[] }>(
      `/git/repositories/${repoId}/pullrequests/${prId}/iterations/${latestIteration}/changes`
    )
    
    // Create a clean, serializable array with only the properties we need
    const changes: FileChange[] = []
    
    for (const change of changesData.changeEntries || []) {
      // Only extract the properties we need and ensure they're serializable
      const cleanChange: FileChange = {
        changeType: (change.changeType || 'edit') as 'edit' | 'add' | 'delete',
        item: {
          gitObjectType: (change.item?.gitObjectType || 'blob') as 'blob' | 'tree',
          path: String(change.item?.path || ''),
          url: String(change.item?.url || '')
        }
      }
      
      // Add newContent if it exists and is serializable
      if (change.newContent && typeof change.newContent === 'object') {
        cleanChange.newContent = {
          content: String(change.newContent.content || ''),
          contentType: String(change.newContent.contentType || 'text/plain')
        }
      }
      
      changes.push(cleanChange)
    }
    
    return createSafeObject(changes)
  } catch (error) {
    console.error('Failed to fetch changed files:', error)
    throw new Error('Failed to fetch changed files from Azure DevOps')
  }
}

export async function getRepositoryByName(repoName: string): Promise<Repo | null> {
  try {
    const repos = await listRepositories()
    const repo = repos.find(repo => repo.name === repoName) || null
    return repo ? createSafeObject(repo) : null
  } catch (error) {
    console.error('Failed to get repository by name:', error)
    return null
  }
} 