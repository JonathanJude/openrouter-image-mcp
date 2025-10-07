import { Config } from '../config/index.js';
import { OpenRouterClient } from '../utils/openrouter-client.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { Logger } from '../utils/logger.js';
import { ImageAnalysisOptions, ImageInput } from '../types/index.js';

export async function handleAnalyzeImage(
  args: any,
  config: Config,
  openRouterClient: OpenRouterClient,
  logger: Logger
) {
  const imageProcessor = ImageProcessor.getInstance();

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

    // Add timeout for image processing (30 seconds)
    const processTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Image processing timed out after 30 seconds')), 30000);
    });

    // Process the image with timeout
    const processedImage = await Promise.race([
      imageProcessor.processImage(imageInput),
      processTimeoutPromise
    ]) as { data: string; mimeType: string; size: number };

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

    // Add timeout for the API call (120 seconds)
    const apiTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Image analysis timed out after 2 minutes')), 120000);
    });

    // Analyze the image with timeout
    const analysisPromise = openRouterClient.analyzeImage(
      processedImage.data,
      processedImage.mimeType,
      options.prompt || 'Analyze this image in detail. Describe what you see, including objects, people, text, and any notable features.',
      options
    );

    const result = await Promise.race([analysisPromise, apiTimeoutPromise]);

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

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}. The image may be too large or the server is experiencing delays.`,
          },
        ],
        isError: true,
      };
    }

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
}