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
}