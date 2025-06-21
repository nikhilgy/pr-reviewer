// Debug script to test serialization
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

console.log('🐛 Debug Serialization Issue')
console.log('============================\n')

async function testSerialization() {
  try {
    // Test if we can import the actions
    const { listChangedFiles, getRepositoryByName } = require('./actions/azure-devops.ts')
    
    // Get a repository
    const repos = await require('./actions/azure-devops.ts').listRepositories()
    if (repos.length === 0) {
      console.log('No repositories found')
      return
    }
    
    const repo = repos[0]
    console.log(`Testing with repository: ${repo.name}`)
    
    // Get pull requests
    const prs = await require('./actions/azure-devops.ts').listPullRequests(repo.id)
    if (prs.length === 0) {
      console.log('No pull requests found')
      return
    }
    
    const pr = prs[0]
    console.log(`Testing with PR: ${pr.pullRequestId}`)
    
    // Get changed files
    const files = await listChangedFiles(repo.id, pr.pullRequestId.toString())
    console.log(`Found ${files.length} changed files`)
    
    if (files.length > 0) {
      console.log('\nFirst file data:')
      console.log(JSON.stringify(files[0], null, 2))
      
      // Test serialization
      try {
        const serialized = JSON.stringify(files)
        const deserialized = JSON.parse(serialized)
        console.log('✅ Serialization test passed')
        
        // Test if it can be passed to a mock component
        const mockComponent = (data) => {
          console.log('Mock component received:', typeof data)
          return data
        }
        
        const result = mockComponent(files)
        console.log('✅ Component passing test passed')
        
      } catch (error) {
        console.log('❌ Serialization test failed:', error.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSerialization() 