Quick Setup Guide

  1. Get OpenRouter API Key

  First, you'll need an API key from OpenRouter:
  - Visit https://openrouter.ai
  - Sign up for an account
  - Go to your API keys section and create a new key
  - Copy the key (it starts with sk-or-v1-...)

  2. Install the MCP Server

  You have two options:

  Option A: Install from npm (when published)
  npm install -g openrouter-image-mcp

  Option B: Build from source (current setup)
  # Build the project
  npm run build

  # Install globally
  npm install -g .

  3. Configure Environment Variables

  Create a .env file or set environment variables:

  # Copy the example file
  cp .env.example .env

  # Edit the .env file
  nano .env

  Add your configuration:
  OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
  OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

  # Optional settings
  LOG_LEVEL=info
  MAX_IMAGE_SIZE=10485760

  4. Configure Your MCP Client

  For Claude Desktop, add to your claude_desktop_config.json:

  {
    "mcpServers": {
      "openrouter-image": {
        "command": "openrouter-image-mcp",
        "env": {
          "OPENROUTER_API_KEY": "sk-or-v1-your-actual-api-key-here",
          "OPENROUTER_MODEL": "anthropic/claude-3.5-sonnet"
        }
      }
    }
  }

  For other MCP clients, check their documentation for adding MCP servers.

  5. Test the Setup

  Start using the tools! Here are some examples:

  Usage Examples

  Basic Image Analysis

  Use the analyze_image tool with:
  - type: "file"
  - data: "/path/to/your/image.jpg"
  - prompt: "Describe what you see in this image"

  Webpage Screenshot Analysis

  Use the analyze_webpage_screenshot tool with:
  - type: "file"
  - data: "/path/to/screenshot.png"
  - focusArea: "layout"
  - format: "json"

  Mobile App Analysis

  Use the analyze_mobile_app_screenshot tool with:
  - type: "file"
  - data: "/path/to/app-screenshot.png" 
  - platform: "ios"
  - includeUXHeuristics: true

  URL-based Analysis

  Use any tool with:
  - type: "url"
  - data: "https://example.com/image.jpg"

  Available Tools

  1. analyze_image - General image analysis
  2. analyze_webpage_screenshot - Specialized webpage analysis
  3. analyze_mobile_app_screenshot - Mobile app UX analysis

  Supported Image Formats

  - JPEG (.jpg, .jpeg)
  - PNG (.png)
  - WebP (.webp)
  - GIF (.gif)

  Common Troubleshooting

  "OPENROUTER_API_KEY environment variable is required"
  - Make sure your API key is set correctly
  - Check that your MCP client is passing the environment variables

  "Invalid or unsupported model"
  - Use a vision-capable model like anthropic/claude-3.5-sonnet
  - Check https://openrouter.ai/models for available options

  "Image size exceeds maximum"
  - Reduce image size or compress it
  - Increase MAX_IMAGE_SIZE environment variable

  Recommended Models

  - anthropic/claude-3.5-sonnet (best overall)
  - anthropic/claude-3-haiku (faster, cheaper)
  - openai/gpt-4-vision-preview (good for technical images)
  - google/gemini-pro-vision (good for general analysis)

  Would you like me to help you with any specific part of the setup or show you how to use a particular feature?

  Todos
  ☒ Initialize Node.js project with package.json
  ☒ Install MCP SDK and required dependencies
  ☒ Set up TypeScript configuration
  ☒ Create basic MCP server structure
  ☒ Add development and build scripts
  ☒ Implement server initialization and configuration
  ☒ Add OpenRouter API client integration
  ☒ Implement configuration validation (API key, model ID)
  ☒ Implement logging and error handling framework
  ☒ Implement graceful shutdown handling
  ☒ Implement base64 image decoding and validation
  ☒ Add local file path reading and processing
  ☒ Implement URL image fetching and validation
  ☒ Add image format validation and conversion
  ☒ Create unified image preprocessing pipeline
  ☒ Implement OpenRouter API authentication
  ☒ Add model validation against OpenRouter's available models
  ☒ Implement vision model API request formatting
  ☒ Add retry logic with exponential backoff (max 3 attempts)
  ☒ Implement comprehensive error handling for API responses
  ☒ Create main analyze_image tool with multiple input formats
  ☒ Implement default text analysis output format
  ☒ Add configurable structured output format (JSON)
  ☒ Create specialized analysis for webpage screenshots
  ☒ Add mobile app screenshot analysis capabilities
  ☒ Implement environment variable configuration
  ☒ Add configuration validation and error messages
  ☒ Create configuration examples and documentation
  ☒ Add secure API key handling
  ☒ Implement model selection persistence
  ☒ Test build and compilation
  ☒ Create unit tests for image processing functions
  ☐ Add integration tests with OpenRouter API (mock)
  ☐ Test error handling and retry logic
  ☐ Validate all input formats (base64, file, URL)
  ☒ Test configuration validation and error cases
  ☒ Create comprehensive README with setup instructions
  ☒ Add API documentation and usage examples
  ☒ Create configuration guide
  ☒ Add troubleshooting section
  ☒ Prepare npm package for distribution
  ☒ Final documentation review and cleanup