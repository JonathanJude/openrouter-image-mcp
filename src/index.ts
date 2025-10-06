import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Config } from './config/index.js';
import { OpenRouterClient } from './utils/openrouter-client.js';
import { Logger } from './utils/logger.js';
import { registerAnalyzeImageTool } from './tools/analyze-image.js';
import { registerAnalyzeWebpageTool } from './tools/analyze-webpage.js';
import { registerAnalyzeMobileAppTool } from './tools/analyze-mobile-app.js';

async function main() {
  const logger = Logger.getInstance();
  const config = Config.getInstance();

  try {
    logger.info('Starting OpenRouter Image MCP Server');

    // Initialize configuration
    const openRouterConfig = config.getOpenRouterConfig();
    const serverConfig = config.getServerConfig();

    // Initialize OpenRouter client
    const openRouterClient = OpenRouterClient.getInstance(openRouterConfig);

    // Test connection
    logger.info('Testing OpenRouter API connection...');
    const connectionTest = await openRouterClient.testConnection();
    if (!connectionTest) {
      throw new Error('Failed to connect to OpenRouter API');
    }
    logger.info('OpenRouter API connection successful');

    // Validate model
    logger.info(`Validating model: ${openRouterConfig.model}`);
    const modelValid = await openRouterClient.validateModel(openRouterConfig.model);
    if (!modelValid) {
      throw new Error(`Invalid or unsupported model: ${openRouterConfig.model}`);
    }
    logger.info(`Model validation successful: ${openRouterConfig.model}`);

    // Create MCP server
    const server = new Server(
      {
        name: 'openrouter-image-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tools
    registerAnalyzeImageTool(server);
    registerAnalyzeWebpageTool(server);
    registerAnalyzeMobileAppTool(server);

    // List tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'analyze_image',
          description: 'Analyze images using OpenRouter\'s vision models. Supports various input formats including base64, file paths, and URLs.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['base64', 'file', 'url'],
                description: 'The type of image input',
              },
              data: {
                type: 'string',
                description: 'The image data (base64 string, file path, or URL)',
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the image (required for base64 input)',
              },
              prompt: {
                type: 'string',
                description: 'Custom prompt for image analysis (optional)',
              },
              format: {
                type: 'string',
                enum: ['text', 'json'],
                description: 'Output format (default: text)',
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum tokens in response (default: 4000)',
              },
              temperature: {
                type: 'number',
                minimum: 0,
                maximum: 2,
                description: 'Sampling temperature (default: 0.1)',
              },
            },
            required: ['type', 'data'],
          },
        },
        {
          name: 'analyze_webpage_screenshot',
          description: 'Specialized tool for analyzing webpage screenshots. Extracts content, layout information, and interactive elements from web pages.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['base64', 'file', 'url'],
                description: 'The type of image input',
              },
              data: {
                type: 'string',
                description: 'The webpage screenshot data (base64 string, file path, or URL)',
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the image (required for base64 input)',
              },
              focusArea: {
                type: 'string',
                enum: ['layout', 'content', 'navigation', 'forms', 'interactive', 'accessibility'],
                description: 'Specific area to focus on (optional)',
              },
              includeAccessibility: {
                type: 'boolean',
                description: 'Include accessibility analysis (default: true)',
              },
              format: {
                type: 'string',
                enum: ['text', 'json'],
                description: 'Output format (default: json for structured webpage analysis)',
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum tokens in response (default: 4000)',
              },
            },
            required: ['type', 'data'],
          },
        },
        {
          name: 'analyze_mobile_app_screenshot',
          description: 'Specialized tool for analyzing mobile app screenshots. Provides insights into UI design, user experience, platform conventions, and app functionality.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['base64', 'file', 'url'],
                description: 'The type of image input',
              },
              data: {
                type: 'string',
                description: 'The mobile app screenshot data (base64 string, file path, or URL)',
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the image (required for base64 input)',
              },
              platform: {
                type: 'string',
                enum: ['ios', 'android', 'auto-detect'],
                description: 'Mobile platform (default: auto-detect)',
              },
              focusArea: {
                type: 'string',
                enum: ['ui-design', 'user-experience', 'navigation', 'accessibility', 'performance', 'onboarding'],
                description: 'Specific area to focus on (optional)',
              },
              includeUXHeuristics: {
                type: 'boolean',
                description: 'Include UX heuristic evaluation (default: true)',
              },
              format: {
                type: 'string',
                enum: ['text', 'json'],
                description: 'Output format (default: json for structured mobile analysis)',
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum tokens in response (default: 4000)',
              },
            },
            required: ['type', 'data'],
          },
        },
      ];

      return { tools };
    });

    // Error handling
    server.onerror = (error) => {
      logger.error('MCP Server error', error);
    };

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('OpenRouter Image MCP Server started successfully');
    logger.info(`Using model: ${openRouterConfig.model}`);
    logger.info(`Max image size: ${serverConfig.maxImageSize} bytes`);
    logger.info(`Log level: ${serverConfig.logLevel}`);

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = Logger.getInstance();
  logger.error('Unhandled Rejection at:', { reason, promise });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = Logger.getInstance();
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();