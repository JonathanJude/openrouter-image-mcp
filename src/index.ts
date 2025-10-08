#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Config } from './config/index.js';
import { handleAnalyzeImage } from './tools/analyze-image.js';
import { handleAnalyzeMobileApp } from './tools/analyze-mobile-app.js';
import { handleAnalyzeWebpage } from './tools/analyze-webpage.js';
import { Logger } from './utils/logger.js';
import { OpenRouterClient } from './utils/openrouter-client.js';

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

    // Centralized tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('Arguments are required');
      }

      try {
        switch (name) {
          case 'analyze_image':
            return await handleAnalyzeImage(args, config, openRouterClient, logger);
          case 'analyze_webpage_screenshot':
            return await handleAnalyzeWebpage(args, config, openRouterClient, logger);
          case 'analyze_mobile_app_screenshot':
            return await handleAnalyzeMobileApp(args, config, openRouterClient, logger);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool call failed for ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
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

    // Start the server - connect FIRST before any validation
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('OpenRouter Image MCP Server started successfully');
    logger.info(`Using model: ${openRouterConfig.model}`);
    logger.info(`Max image size: ${serverConfig.maxImageSize} bytes`);
    logger.info(`Log level: ${serverConfig.logLevel}`);

    // Validate connection and model AFTER connecting (non-blocking for MCP client)
    logger.info('Testing OpenRouter API connection...');
    const connectionTest = await openRouterClient.testConnection();
    if (!connectionTest) {
      logger.error('Failed to connect to OpenRouter API - tools may not work');
    } else {
      logger.info('OpenRouter API connection successful');
    }

    logger.info(`Validating model: ${openRouterConfig.model}`);
    const modelValid = await openRouterClient.validateModel(openRouterConfig.model);
    if (!modelValid) {
      logger.warn(`Model validation failed: ${openRouterConfig.model} - tools may not work as expected`);
    } else {
      logger.info(`Model validation successful: ${openRouterConfig.model}`);
    }

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