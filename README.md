<div align="center">

# 🖼️🤖 OpenRouter Image MCP Server

[![npm version](https://badge.fury.io/js/openrouter-image-mcp.svg)](https://badge.fury.io/js/openrouter-image-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

**🔥 Supercharge your AI agents with powerful image analysis capabilities!** 🔥

A blazing-fast ⚡ MCP (Model Context Protocol) server that enables AI agents to **see and understand images** using OpenRouter's cutting-edge vision models. Perfect for screenshots, photos, diagrams, and any visual content! 📸✨

</div>

---

## 🌟 What Makes This Special?

- **🎯 Multi-Model Support**: Choose from Claude, Gemini, GPT-4 Vision, and more!
- **🚀 Lightning Fast**: Built with TypeScript and optimized for performance
- **🔧 Flexible Input**: Support for file paths, URLs, and base64 data
- **💰 Cost-Effective**: Smart model selection for the best price-to-quality ratio
- **🛡️ Production Ready**: Robust error handling, retries, and comprehensive logging
- **🎨 Easy Integration**: Works seamlessly with Claude Code, Cline, Cursor, and more!

---

## 🚀 Quick Start

### Prerequisites 📋

- **Node.js** 18+ ⚡
- **OpenRouter API Key** 🔑 (Get one at [openrouter.ai](https://openrouter.ai))
- **Your favorite MCP client** 🤖 (Claude Code, Cline, etc.)

### Installation 📦

```bash
# 🌟 Option 1: Install from npm (recommended)
npm install -g openrouter-image-mcp

# 🛠️ Option 2: Clone and build locally
git clone https://github.com/your-username/openrouter-image-mcp.git
cd openrouter-image-mcp
npm install
npm run build
npm install -g .
```

### Configuration ⚙️

```bash
# 📋 Copy the environment template
cp .env.example .env

# ✏️ Edit with your credentials
nano .env
```

Add your OpenRouter credentials:

```bash
# 🔑 Required
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_MODEL=google/gemini-2.5-flash-lite-preview-09-2025

# 🎛️ Optional (with defaults)
LOG_LEVEL=info
MAX_IMAGE_SIZE=10485760
RETRY_ATTEMPTS=3
```

---

## 🏠 **Works Locally - No Restarts Needed!** 🎯

**🚀 HUGE ADVANTAGE**: This MCP server works perfectly locally with **zero manual intervention** once configured! No restarts, no manual server starts, no fiddling with settings. It just **works**! ✨

### 🔄 **How It Works Automatically**

1. **🎯 Configure once** → Set up your MCP client one time
2. **🚀 Auto-launches** → Client starts the server automatically
3. **🔧 Connects** → Validates API and loads models instantly
4. **🛠️ Ready to use** → All 3 tools available immediately

### ⚡ **Local Setup Benefits**

- **🔥 Fire-and-forget**: Set up once, forget forever
- **⚡ Lightning startup**: ~5 seconds total ready time
- **🔄 Persistent across restarts**: Survives laptop shutdowns
- **📱 Cross-platform**: Works on any OS with Node.js
- **🎯 Zero maintenance**: No babysitting required

---

## 🔧 MCP Configuration

Add this configuration to your AI agent's MCP settings:

```json
{
  "mcpServers": {
    "openrouter-image": {
      "command": "node",
      "args": ["/path/to/openrouter-image-mcp/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-api-key-here",
        "OPENROUTER_MODEL": "google/gemini-2.5-flash-lite-preview-09-2025"
      }
    }
  }
}
```

**Configuration files:**
- **Claude Code**: `/Users/jude/.claude.json`
- **Cursor**: `~/.cursor/mcp.json`
- **Cline**: `~/.cline/mcp.json`
- **Windsurf**: MCP settings file
- **Other agents**: Check your agent's MCP documentation

> **Note**: Replace `/path/to/openrouter-image-mcp/` with the actual path where you cloned or installed this project.

### 💡 **Pro Tips for Local Setup**

#### **🎯 Path Management**
- **Absolute paths work best**: `/path/to/openrouter-image-mcp/dist/index.js`
- **Avoid relative paths**: May break when switching directories
- **Use your actual path**: Update the examples with your real project location

#### **🔧 Environment Variables**
- **Set in `.env` file**: Keep your API key secure
- **OR set in system**: `export OPENROUTER_API_KEY=sk-or-v1-...`
- **Test quickly**: Run `OPENROUTER_API_KEY=... node dist/index.js`

#### **🚀 Quick Verification**
```bash
# 🔍 Test if server works
export OPENROUTER_API_KEY=sk-or-v1-your-key
export OPENROUTER_MODEL=google/gemini-2.5-flash-lite-preview-09-2025
node dist/index.js

# ✅ Should see logs: "Starting OpenRouter Image MCP Server"
```

#### **🐛 Troubleshooting Local Issues**

**❌ "Command not found"**
```bash
# ✅ Use absolute path to node
"/usr/local/bin/node" "/path/to/openrouter-image-mcp/dist/index.js"
```

**❌ "File not found"**
```bash
# ✅ Verify the built file exists
ls -la /path/to/openrouter-image-mcp/dist/index.js

# 📝 Rebuild if missing
npm run build
```

**❌ "API key required"**
```bash
# ✅ Check your environment variables
echo $OPENROUTER_API_KEY

# 🔧 Or create .env file
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" > .env
```

### 🌟 **Local Development Workflow**

1. **🛠️ Build once**: `npm run build`
2. **⚙️ Configure once**: Add MCP config to your AI agent
3. **🔄 Restart agent**: Pick up the new configuration
4. **🎯 Use immediately**: No manual server management needed!

---

## 🔥 Usage Examples

### With Claude Code 🤖

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openrouter-image": {
      "command": "openrouter-image-mcp",
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-api-key-here",
        "OPENROUTER_MODEL": "google/gemini-2.5-flash-lite-preview-09-2025"
      }
    }
  }
}
```

### 🎯 Amazing Things You Can Do!

```bash
# 📸 Analyze any screenshot
"Analyze this screenshot: /path/to/screenshot.png"

# 🔍 Extract text from images
"What text do you see in this document: /path/to/scan.jpg"

# 🎨 Review UI designs
"Review this UI mockup for accessibility issues: /path/to/design.png"

# 📱 Debug mobile apps
"Analyze this mobile app screenshot for UX problems: /path/to/app.png"

# 🌐 Analyze webpages
"What can you tell me about this webpage: https://example.com/screenshot.png"
```

---

## 🛠️ Available Tools

### 🖼️ `analyze_image` - General Image Analysis
Perfect for photos, diagrams, charts, and general visual content!

**Parameters:**
- `type` 📁 Input type: `file`, `url`, or `base64`
- `data` 📸 Image data (path, URL, or base64 string)
- `prompt` 💭 Custom analysis prompt
- `format` 📊 Output: `text` or `json`
- `maxTokens` 🔢 Maximum response tokens (default: 4000)
- `temperature` 🌡️ Creativity 0-2 (default: 0.1)

### 🌐 `analyze_webpage_screenshot` - Webpage Specialist
Designed specifically for web page analysis and debugging!

**Features:**
- 🎯 Layout analysis
- 📱 Content extraction
- 🔗 Navigation review
- 📝 Form analysis
- ♿ Accessibility evaluation
- 📊 Structured JSON output

### 📱 `analyze_mobile_app_screenshot` - Mobile App Expert
Specialized for mobile application UI/UX analysis!

**Features:**
- 🍎 iOS/🤖 Android platform detection
- 🎨 UI design review
- 👆 User experience evaluation
- ♿ Accessibility analysis
- 📊 UX heuristic scoring
- 🚀 Performance insights

---

## 💰 Vision Model Recommendations

| Model | Cost | Vision Quality | Best For |
|-------|------|----------------|----------|
| 🆓 `google/gemini-2.0-flash-exp:free` | **FREE** | ⭐⭐⭐⭐ | General analysis, docs |
| 🆓 `meta-llama/llama-3.2-90b-vision-instruct` | **FREE** | ⭐⭐⭐⭐ | Charts, diagrams |
| 🌟 `google/gemini-2.5-flash-lite-preview-09-2025` | 💰 **Very Low** | ⭐⭐⭐⭐⭐ | **Best value!** |
| 🧠 `anthropic/claude-3-5-sonnet-20241022` | 💰💰 Medium | ⭐⭐⭐⭐⭐ | Detailed analysis |
| 🔥 `anthropic/claude-3-5-haiku-20241022` | 💰💰💰 Higher | ⭐⭐⭐⭐⭐ | High accuracy |

---

## 🛠️ Development

### Local Setup 🔧

```bash
# 🍴 Clone the repository
git clone https://github.com/your-username/openrouter-image-mcp.git
cd openrouter-image-mcp

# 📦 Install dependencies
npm install

# 🔨 Build the project
npm run build

# 🚀 Start in development mode
npm run dev

# 🧪 Run tests
npm test

# 🔍 Lint and format
npm run lint
npm run format
```

#
---

## 🧪 Testing

### Run Test Suite 🧪

```bash
# 🧪 Run all tests
npm test

# 📊 Run with coverage
npm run test:coverage

# 🔍 Debug mode
DEBUG=* npm test
```

### Manual Testing 🎯

```bash
# 📸 Test with a sample image
node test-image-analysis.js

# 🔍 Test different models
OPENROUTER_MODEL=anthropic/claude-sonnet-4 node test-image-analysis.js

# 🚀 Test with URL input
echo '{"type":"url","data":"https://example.com/image.png","prompt":"What do you see?"}' | node dist/index.js
```

---

## 🤝 Contributing

Contributions welcome! Fork the repo, make changes, and submit a pull request. Please follow the existing code style and add tests for new features.

---

## 📄 Supported Image Formats

| Format | Extension | MIME Type | Status |
|--------|------------|-----------|--------|
| 🖼️ JPEG | `.jpg`, `.jpeg` | `image/jpeg` | ✅ |
| 🖼️ PNG | `.png` | `image/png` | ✅ |
| 🖼️ WebP | `.webp` | `image/webp` | ✅ |
| 🖼️ GIF | `.gif` | `image/gif` | ✅ |
| 📏 **Max Size** | - | - | **10MB** (configurable) |

---

## 🛡️ Security & Privacy

- **🔐 API Keys**: Loaded from environment variables only
- **🚫 No Sensitive Logging**: Personal data never logged
- **✅ Input Validation**: All parameters validated
- **📏 Size Limits**: Configurable file size restrictions
- **🔒 HTTPS Only**: All API communications encrypted
- **🗑️ Data Cleanup**: Temporary files automatically removed

---

## 📚 Troubleshooting

### 🔧 Common Issues & Solutions

#### 🔑 "OPENROUTER_API_KEY environment variable is required"
```bash
# ✅ Solution: Set your API key
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or add to .env file
```

#### 🤖 "Invalid or unsupported model"
```bash
# ✅ Check available models
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models | jq '.data[] | select(.architecture.input_modalities | contains(["image"])) | .id'
```

#### 📡 "Failed to connect to OpenRouter API"
```bash
# ✅ Test connection
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models
```

#### 📏 "Image size exceeds maximum"
```bash
# ✅ Increase limit or compress image
export MAX_IMAGE_SIZE=20971520  # 20MB
```

### 🐛 Debug Mode

```bash
# 🔍 Enable detailed logging
export LOG_LEVEL=debug
npm start

# 📊 Monitor API usage
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/auth/key
```

---


## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.


<div align="center">

**🚀 Ready to give your AI agents the power of sight?**

**[⭐ Star this repo](https://github.com/your-username/openrouter-image-mcp) • [🐛 Report Issues](https://github.com/your-username/openrouter-image-mcp/issues) • [💡 Suggest Features](https://github.com/your-username/openrouter-image-mcp/discussions)**

Made with ❤️ by the open-source community