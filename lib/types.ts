// Azure DevOps API types based on official REST API documentation

export interface Repo {
  id: string
  name: string
  url: string
  project: {
    id: string
    name: string
  }
  defaultBranch: string
  size: number
  remoteUrl: string
  sshUrl: string
  webUrl: string
  lastUpdateTime: string
}

export interface PullRequest {
  pullRequestId: number
  codeReviewId: number
  status: "active" | "abandoned" | "completed"
  createdBy: {
    displayName: string
    url: string
    id: string
    uniqueName: string
    imageUrl: string
  }
  creationDate: string
  title: string
  description: string
  sourceRefName: string
  targetRefName: string
  mergeStatus: string
  isDraft: boolean
  mergeId: string
  lastMergeSourceCommit: {
    commitId: string
    url: string
  }
  lastMergeTargetCommit: {
    commitId: string
    url: string
  }
  reviewers: Array<{
    reviewerUrl: string
    vote: number
    displayName: string
    imageUrl: string
    uniqueName: string
    id: string
  }>
  url: string
}

export interface FileChange {
  changeType: "add" | "edit" | "delete"
  item: {
    gitObjectType: "blob" | "tree"
    path: string
    url: string
  }
  newContent?: {
    content: string
    contentType: string
  }
}

export interface FileMeta {
  path: string
  language: string
  diff: string
  fullText: string
}

export interface ReviewChunk {
  file: string
  severity: "BLOCKER" | "MAJOR" | "MINOR" | "NIT"
  message: string
}
