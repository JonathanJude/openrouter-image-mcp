import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { Config } from '../config/index.js';
import { OpenRouterClient } from '../utils/openrouter-client.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { Logger } from '../utils/logger.js';
import { ImageAnalysisOptions, ImageInput } from '../types/index.js';

export function registerAnalyzeImageTool(server: Server): void {
  const config = Config.getInstance();
  const openRouterClient = OpenRouterClient.getInstance(config.getOpenRouterConfig());
  const imageProcessor = ImageProcessor.getInstance();
  const logger = Logger.getInstance();

  const tool: Tool = {
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
  };

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name !== tool.name) {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (!args) {
      throw new Error('Arguments are required');
    }

    try {
      const imageInput: ImageInput = {
        type: args.type as 'base64' | 'file' | 'url',
        data: args.data as string,
        mimeType: args.mimeType as string,
      };

      const options: ImageAnalysisOptions = {
        prompt: args.prompt as string,
        format: args.format as 'text' | 'json',
        maxTokens: args.maxTokens as number,
        temperature: args.temperature as number,
      };

      logger.info(`Starting image analysis for type: ${imageInput.type}`);

      // Process the image
      const processedImage = await imageProcessor.processImage(imageInput);

      // Validate image type
      if (!imageProcessor.isValidImageType(processedImage.mimeType)) {
        throw new Error(`Unsupported image type: ${processedImage.mimeType}`);
      }

      // Check file size
      const serverConfig = config.getServerConfig();
      const maxImageSize = serverConfig.maxImageSize || 10485760;
      if (processedImage.size > maxImageSize) {
        throw new Error(`Image size ${processedImage.size} exceeds maximum allowed size ${maxImageSize}`);
      }

      // Analyze the image
      const result = await openRouterClient.analyzeImage(
        processedImage.data,
        processedImage.mimeType,
        options.prompt || 'Analyze this image in detail. Describe what you see, including objects, people, text, and any notable features.',
        options
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze image');
      }

      logger.info(`Image analysis completed successfully`, {
        model: result.model,
        usage: result.usage,
      });

      return {
        content: [
          {
            type: 'text',
            text: result.analysis || 'No analysis available',
          },
        ],
      };
    } catch (error) {
      logger.error('Image analysis failed', error);
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

  logger.info('analyze_image tool registered');
}