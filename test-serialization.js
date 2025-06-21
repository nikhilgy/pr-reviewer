// Test script to verify data serialization
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

console.log('🧪 Testing Data Serialization')
console.log('==============================\n')

async function testSerialization() {
  try {
    // Import the server action
    const { listRepositories, listChangedFiles } = require('./actions/azure-devops.ts')
    
    console.log('Testing repository serialization...')
    const repos = await listRepositories()
    console.log(`✅ Found ${repos.length} repositories`)
    
    if (repos.length > 0) {
      const firstRepo = repos[0]
      console.log('Sample repository data:')
      console.log(JSON.stringify(firstRepo, null, 2))
      
      // Test if it can be serialized
      const serialized = JSON.stringify(repos)
      const deserialized = JSON.parse(serialized)
      console.log('✅ Repository data serialization test passed')
      
      // Test pull requests if we have a repo
      console.log('\nTesting pull request serialization...')
      const prs = await listPullRequests(firstRepo.id)
      console.log(`✅ Found ${prs.length} pull requests`)
      
      if (prs.length > 0) {
        const firstPR = prs[0]
        console.log('Sample PR data:')
        console.log(JSON.stringify(firstPR, null, 2))
        
        // Test if it can be serialized
        const prSerialized = JSON.stringify(prs)
        const prDeserialized = JSON.parse(prSerialized)
        console.log('✅ Pull request data serialization test passed')
        
        // Test changed files
        console.log('\nTesting changed files serialization...')
        const files = await listChangedFiles(firstRepo.id, firstPR.pullRequestId.toString())
        console.log(`✅ Found ${files.length} changed files`)
        
        if (files.length > 0) {
          const firstFile = files[0]
          console.log('Sample file data:')
          console.log(JSON.stringify(firstFile, null, 2))
          
          // Test if it can be serialized
          const fileSerialized = JSON.stringify(files)
          const fileDeserialized = JSON.parse(fileSerialized)
          console.log('✅ Changed files data serialization test passed')
        }
      }
    }
    
    console.log('\n🎉 All serialization tests passed!')
    
  } catch (error) {
    console.error('❌ Serialization test failed:', error.message)
  }
}

testSerialization() 