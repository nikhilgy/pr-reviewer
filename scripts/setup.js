#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setup() {
  console.log('🚀 Nikhil\'s PR Reviewer Setup')
  console.log('==============================\n')
  
  console.log('This script will help you configure the environment variables needed for Nikhil\'s PR Reviewer.\n')
  
  // Azure DevOps Configuration
  console.log('📋 Azure DevOps Configuration')
  console.log('-------------------------------')
  
  const org = await question('Enter your Azure DevOps organization name: ')
  const project = await question('Enter your Azure DevOps project name: ')
  const pat = await question('Enter your Azure DevOps Personal Access Token (PAT): ')
  
  console.log('\n🤖 OpenAI Configuration')
  console.log('----------------------')
  
  const openaiKey = await question('Enter your OpenAI API key: ')
  
  // Create .env.local file
  const envContent = `# Azure DevOps Configuration
AZURE_DEVOPS_ORG=${org}
AZURE_DEVOPS_PROJECT=${project}
AZURE_DEVOPS_PAT=${pat}

# OpenAI Configuration (for AI reviews)
OPENAI_API_KEY=${openaiKey}
`
  
  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('\n✅ Configuration saved to .env.local')
    console.log('\n📝 Next steps:')
    console.log('1. Make sure .env.local is in your .gitignore file')
    console.log('2. Restart your development server: npm run dev')
    console.log('3. Test the connection by visiting the application')
    console.log('\n⚠️  Important: Keep your PAT and API keys secure and never commit them to version control!')
  } catch (error) {
    console.error('❌ Error saving configuration:', error.message)
  }
  
  rl.close()
}

setup().catch(console.error) 