// Test script to verify Azure DevOps connection
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim()
    }
  })
}

console.log('🔍 Azure DevOps Connection Test')
console.log('===============================\n')

// Check environment variables
console.log('Environment Variables:')
console.log('AZURE_DEVOPS_ORG:', process.env.AZURE_DEVOPS_ORG || '❌ NOT SET')
console.log('AZURE_DEVOPS_PROJECT:', process.env.AZURE_DEVOPS_PROJECT || '❌ NOT SET')
console.log('AZURE_DEVOPS_PAT:', process.env.AZURE_DEVOPS_PAT ? '✅ SET' : '❌ NOT SET')
console.log('')

if (!process.env.AZURE_DEVOPS_ORG || !process.env.AZURE_DEVOPS_PROJECT || !process.env.AZURE_DEVOPS_PAT) {
  console.log('❌ Missing required environment variables!')
  console.log('')
  console.log('Please create a .env.local file with:')
  console.log('AZURE_DEVOPS_ORG=your-organization')
  console.log('AZURE_DEVOPS_PROJECT=your-project')
  console.log('AZURE_DEVOPS_PAT=your-personal-access-token')
  console.log('')
  console.log('Or run: npm run setup')
  process.exit(1)
}

// Test the API call
async function testConnection() {
  try {
    const org = process.env.AZURE_DEVOPS_ORG
    const project = process.env.AZURE_DEVOPS_PROJECT
    const pat = process.env.AZURE_DEVOPS_PAT
    
    const baseUrl = `https://dev.azure.com/${org}/${project}/_apis`
    const credentials = Buffer.from(`:${pat}`).toString('base64')
    
    console.log('Testing API connection...')
    
    const response = await fetch(`${baseUrl}/git/repositories?api-version=7.0`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Connection successful!')
    console.log(`Found ${data.value?.length || 0} repositories`)
    
    if (data.value && data.value.length > 0) {
      console.log('\nRepositories:')
      data.value.slice(0, 5).forEach(repo => {
        console.log(`  - ${repo.name} (ID: ${repo.id})`)
      })
      if (data.value.length > 5) {
        console.log(`  ... and ${data.value.length - 5} more`)
      }
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message)
    console.log('')
    console.log('Possible issues:')
    console.log('1. Invalid organization or project name')
    console.log('2. Invalid or expired Personal Access Token')
    console.log('3. Network connectivity issues')
    console.log('4. Insufficient permissions for the PAT')
  }
}

testConnection() 