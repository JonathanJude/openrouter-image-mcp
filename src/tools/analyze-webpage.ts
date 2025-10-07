import { Config } from '../config/index.js';
import { OpenRouterClient } from '../utils/openrouter-client.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { Logger } from '../utils/logger.js';

export async function handleAnalyzeWebpage(
  args: any,
  config: Config,
  openRouterClient: OpenRouterClient,
  logger: Logger
) {
  const imageProcessor = ImageProcessor.getInstance();

  try {
    const imageInput = {
      type: args.type as 'base64' | 'file' | 'url',
      data: args.data as string,
      mimeType: args.mimeType as string,
    };

    const focusArea = args.focusArea as string;
    const includeAccessibility = args.includeAccessibility !== false;
    const format = args.format as 'text' | 'json' || 'json';
    const maxTokens = args.maxTokens as number || 4000;

    logger.info(`Starting webpage screenshot analysis for type: ${imageInput.type}, focus: ${focusArea}`);

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

    // Build specialized prompt for webpage analysis
    let prompt = 'Analyze this webpage screenshot and provide detailed information about its structure, content, and design.';

    if (focusArea) {
      switch (focusArea) {
        case 'layout':
          prompt += ' Focus specifically on the layout structure, grid system, spacing, and visual hierarchy.';
          break;
        case 'content':
          prompt += ' Focus specifically on the content, headings, body text, and information architecture.';
          break;
        case 'navigation':
          prompt += ' Focus specifically on navigation elements, menus, breadcrumbs, and user pathways.';
          break;
        case 'forms':
          prompt += ' Focus specifically on form elements, input fields, buttons, and validation indicators.';
          break;
        case 'interactive':
          prompt += ' Focus specifically on interactive elements like buttons, links, hover states, and calls-to-action.';
          break;
        case 'accessibility':
          prompt += ' Focus specifically on accessibility features, contrast ratios, alt text indicators, and keyboard navigation.';
          break;
      }
    }

    prompt += ' Include specific details about:';

    if (includeAccessibility || focusArea === 'accessibility') {
      prompt += ' accessibility considerations, color contrast, font sizes, and assistive technology compatibility;';
    }

    prompt += ' responsive design indicators, viewport information, and mobile optimization; visual design elements like colors, typography, and branding; user experience considerations and potential usability issues; any errors, warnings, or unusual states visible.';

    if (format === 'json') {
      prompt += ' Provide your analysis in a structured JSON format with the following schema: {"page_title": "string", "url": "string (if visible)", "layout": {"header": "description", "navigation": "description", "main_content": "description", "sidebar": "description", "footer": "description"}, "content": {"headings": ["list"], "body_text": "summary", "key_elements": ["list"]}, "interactive_elements": {"buttons": ["list"], "links": ["list"], "forms": ["list"]}, "design": {"color_scheme": "description", "typography": "description", "branding": "description"}, "accessibility": {"score": "1-10", "issues": ["list"], "positive_aspects": ["list"]}, "usability": {"strengths": ["list"], "issues": ["list"], "recommendations": ["list"]}, "technical_notes": "technical observations"}';
    }

    // Analyze the webpage screenshot
    const result = await openRouterClient.analyzeImage(
      processedImage.data,
      processedImage.mimeType,
      prompt,
      { format, maxTokens }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze webpage screenshot');
    }

    logger.info(`Webpage screenshot analysis completed successfully`, {
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
    logger.error('Webpage screenshot analysis failed', error);
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