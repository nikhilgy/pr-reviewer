import type { Repo, PullRequest, FileChange } from "./types"
import { config } from "./config"

// Azure DevOps API configuration
const BASE_URL = `https://dev.azure.com/${config.azureDevOps.organization}/${config.azureDevOps.project}/_apis`

// Create authorization header
const createAuthHeader = () => {
  if (!config.azureDevOps.pat || config.azureDevOps.pat === 'your-pat') {
    throw new Error('Azure DevOps PAT not configured. Please set AZURE_DEVOPS_PAT environment variable.')
  }
  
  const credentials = btoa(`:${config.azureDevOps.pat}`)
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
    
    return data.value.map(repo => ({
      id: repo.id,
      name: repo.name,
      url: repo.url,
      project: {
        id: repo.project?.id || '',
        name: repo.project?.name || ''
      },
      defaultBranch: repo.defaultBranch || 'refs/heads/main',
      size: repo.size || 0,
      remoteUrl: repo.remoteUrl || '',
      sshUrl: repo.sshUrl || '',
      webUrl: repo.webUrl || '',
      lastUpdateTime: repo.lastUpdateTime || new Date().toISOString()
    }))
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
    
    return data.value.map(pr => ({
      pullRequestId: pr.pullRequestId,
      codeReviewId: pr.codeReviewId,
      status: pr.status,
      createdBy: {
        displayName: pr.createdBy?.displayName || '',
        url: pr.createdBy?.url || '',
        id: pr.createdBy?.id || '',
        uniqueName: pr.createdBy?.uniqueName || '',
        imageUrl: pr.createdBy?.imageUrl || ''
      },
      creationDate: pr.creationDate,
      title: pr.title,
      description: pr.description || '',
      sourceRefName: pr.sourceRefName,
      targetRefName: pr.targetRefName,
      mergeStatus: pr.mergeStatus || '',
      isDraft: pr.isDraft || false,
      mergeId: pr.mergeId || '',
      lastMergeSourceCommit: {
        commitId: pr.lastMergeSourceCommit?.commitId || '',
        url: pr.lastMergeSourceCommit?.url || ''
      },
      lastMergeTargetCommit: {
        commitId: pr.lastMergeTargetCommit?.commitId || '',
        url: pr.lastMergeTargetCommit?.url || ''
      },
      reviewers: (pr.reviewers || []).map((reviewer: any) => ({
        reviewerUrl: reviewer.reviewerUrl || '',
        vote: reviewer.vote || 0,
        displayName: reviewer.displayName || '',
        imageUrl: reviewer.imageUrl || '',
        uniqueName: reviewer.uniqueName || '',
        id: reviewer.id || ''
      })),
      url: pr.url
    }))
  } catch (error) {
    console.error('Failed to fetch pull requests:', error)
    throw new Error('Failed to fetch pull requests from Azure DevOps')
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
    
    return (changesData.changeEntries || []).map(change => ({
      changeType: change.changeType,
      item: {
        gitObjectType: change.item?.gitObjectType || 'blob',
        path: change.item?.path || '',
        url: change.item?.url || ''
      }
    }))
  } catch (error) {
    console.error('Failed to fetch changed files:', error)
    throw new Error('Failed to fetch changed files from Azure DevOps')
  }
}

export async function getFileContent(repoId: string, path: string, commitSha: string): Promise<string> {
  try {
    const data = await azureDevOpsApiCall<{ content: string }>(`/git/repositories/${repoId}/items`, {
      path: path,
      version: commitSha
    })
    
    return data.content || ''
  } catch (error) {
    console.error('Failed to fetch file content:', error)
    throw new Error(`Failed to fetch file content for ${path}`)
  }
}

// Helper function to get repository by name
export async function getRepositoryByName(repoName: string): Promise<Repo | null> {
  try {
    const repos = await listRepositories()
    return repos.find(repo => repo.name === repoName) || null
  } catch (error) {
    console.error('Failed to get repository by name:', error)
    return null
  }
}

// Helper function to get pull request by ID
export async function getPullRequestById(repoId: string, prId: string): Promise<PullRequest | null> {
  try {
    const data = await azureDevOpsApiCall<any>(`/git/repositories/${repoId}/pullrequests/${prId}`)
    
    return {
      pullRequestId: data.pullRequestId,
      codeReviewId: data.codeReviewId,
      status: data.status,
      createdBy: {
        displayName: data.createdBy?.displayName || '',
        url: data.createdBy?.url || '',
        id: data.createdBy?.id || '',
        uniqueName: data.createdBy?.uniqueName || '',
        imageUrl: data.createdBy?.imageUrl || ''
      },
      creationDate: data.creationDate,
      title: data.title,
      description: data.description || '',
      sourceRefName: data.sourceRefName,
      targetRefName: data.targetRefName,
      mergeStatus: data.mergeStatus || '',
      isDraft: data.isDraft || false,
      mergeId: data.mergeId || '',
      lastMergeSourceCommit: {
        commitId: data.lastMergeSourceCommit?.commitId || '',
        url: data.lastMergeSourceCommit?.url || ''
      },
      lastMergeTargetCommit: {
        commitId: data.lastMergeTargetCommit?.commitId || '',
        url: data.lastMergeTargetCommit?.url || ''
      },
      reviewers: (data.reviewers || []).map((reviewer: any) => ({
        reviewerUrl: reviewer.reviewerUrl || '',
        vote: reviewer.vote || 0,
        displayName: reviewer.displayName || '',
        imageUrl: reviewer.imageUrl || '',
        uniqueName: reviewer.uniqueName || '',
        id: reviewer.id || ''
      })),
      url: data.url
    }
  } catch (error) {
    console.error('Failed to get pull request by ID:', error)
    return null
  }
}
