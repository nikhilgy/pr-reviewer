// Configuration for Azure DevOps and OpenAI integration

export const config = {
  azureDevOps: {
    organization: process.env.AZURE_DEVOPS_ORG || 'your-organization',
    project: process.env.AZURE_DEVOPS_PROJECT || 'your-project',
    pat: process.env.AZURE_DEVOPS_PAT || 'your-pat',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
  }
}

// Validation function to check if required environment variables are set
export function validateConfig() {
  const errors: string[] = []
  
  if (!config.azureDevOps.pat || config.azureDevOps.pat === 'your-pat') {
    errors.push('AZURE_DEVOPS_PAT environment variable is required')
  }
  
  if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
    errors.push('OPENAI_API_KEY environment variable is required')
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }
}

// Helper function to check if we're in development mode
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
} 