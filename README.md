# Nikhil's PR Reviewer

A modern, AI-powered pull request review tool that integrates with Azure DevOps to provide intelligent code reviews using OpenAI's GPT-4.

## Features

- 🔍 **Real Azure DevOps Integration**: Connect to your actual Azure DevOps repositories and pull requests
- 🤖 **AI-Powered Reviews**: Get intelligent code reviews using OpenAI's GPT-4
- 📁 **File Selection**: Choose specific files to review from pull request changes
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light mode support
- ⚡ **Real-time Streaming**: Watch AI reviews stream in real-time
- 🔒 **Secure**: Environment-based configuration for API keys and tokens

## Quick Start

### 1. Setup Environment

Run the interactive setup script:

```bash
npm run setup
```

This will prompt you for:
- Azure DevOps organization name
- Azure DevOps project name  
- Azure DevOps Personal Access Token (PAT)
- OpenAI API key

### 2. Manual Configuration

Alternatively, create a `.env.local` file in the project root:

```env
# Azure DevOps Configuration
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PROJECT=your-project
AZURE_DEVOPS_PAT=your-personal-access-token

# OpenAI Configuration (for AI reviews)
OPENAI_API_KEY=your-openai-api-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Azure DevOps Setup

### Personal Access Token (PAT)

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create a new token with the following scopes:
   - Code (Read)
   - Pull Requests (Read)
   - Work Items (Read)

### Required Permissions

Your PAT needs access to:
- Read repository information
- Read pull request details
- Read file changes and content

## OpenAI Setup

1. Sign up for an OpenAI account at [https://platform.openai.com](https://platform.openai.com)
2. Generate an API key in your account settings
3. Add the API key to your environment configuration

## Usage

1. **Select Repository**: Choose from your Azure DevOps repositories
2. **Browse Pull Requests**: View active pull requests in the selected repository
3. **Select Files**: Choose specific files to review from the pull request changes
4. **Start AI Review**: Click "Review with AI" to get intelligent feedback
5. **View Results**: Watch the AI review stream in real-time with severity levels

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [repo]/            # Dynamic repository routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── file-picker.tsx   # File selection component
│   ├── review-panel.tsx  # AI review results
│   └── ...
├── contexts/             # React contexts
│   └── review-context.tsx
├── lib/                  # Utility libraries
│   ├── azdo.ts          # Azure DevOps API integration
│   ├── config.ts        # Environment configuration
│   ├── types.ts         # TypeScript definitions
│   └── utils.ts         # Utility functions
├── actions/              # Server actions
│   └── review.ts        # OpenAI AI review integration
├── scripts/             # Setup and utility scripts
│   └── setup.js         # Interactive setup script
├── test/                # Unit tests
└── ...
```

## API Integration

### Azure DevOps REST API

The application uses the Azure DevOps REST API v7.0:

- **Repositories**: `GET /_apis/git/repositories?api-version=7.0`
- **Pull Requests**: `GET /_apis/git/repositories/{repositoryId}/pullrequests?api-version=7.0`
- **PR Changes**: `GET /_apis/git/repositories/{repositoryId}/pullRequests/{pullRequestId}/iterations/{iterationId}/changes?api-version=7.0`
- **File Content**: `GET /_apis/git/repositories/{repositoryId}/items?path={path}&version={version}&api-version=7.0`

### OpenAI API

The AI review feature uses OpenAI's GPT-4 model with streaming responses for real-time feedback.

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

## Security

- All API keys and tokens are stored in environment variables
- The `.env.local` file is automatically ignored by git
- No sensitive data is logged or stored in the application
- All API calls use secure HTTPS connections

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

This project is licensed under the MIT License.
