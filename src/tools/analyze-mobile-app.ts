import { Config } from '../config/index.js';
import { OpenRouterClient } from '../utils/openrouter-client.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { Logger } from '../utils/logger.js';

export async function handleAnalyzeMobileApp(
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

    const platform = args.platform as 'ios' | 'android' | 'auto-detect' || 'auto-detect';
    const focusArea = args.focusArea as string;
    const includeUXHeuristics = args.includeUXHeuristics !== false;
    const format = args.format as 'text' | 'json' || 'json';
    const maxTokens = args.maxTokens as number || 4000;

    logger.info(`Starting mobile app screenshot analysis for type: ${imageInput.type}, platform: ${platform}, focus: ${focusArea}`);

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

    // Build specialized prompt for mobile app analysis
    let prompt = 'Analyze this mobile app screenshot and provide comprehensive insights about its design, user experience, and platform adherence.';

    if (platform !== 'auto-detect') {
      prompt += ` This appears to be an ${platform.toUpperCase()} app, so please evaluate it against ${platform.toUpperCase()} design guidelines and conventions.`;
    } else {
      prompt += ' Please identify the platform (iOS or Android) and evaluate it accordingly.';
    }

    if (focusArea) {
      switch (focusArea) {
        case 'ui-design':
          prompt += ' Focus specifically on UI design elements, visual hierarchy, color usage, typography, spacing, and component design.';
          break;
        case 'user-experience':
          prompt += ' Focus specifically on user experience, flow efficiency, usability, and user journey optimization.';
          break;
        case 'navigation':
          prompt += ' Focus specifically on navigation patterns, menu structures, tab bars, and user movement through the app.';
          break;
        case 'accessibility':
          prompt += ' Focus specifically on accessibility features, contrast ratios, touch targets, screen reader compatibility, and inclusive design.';
          break;
        case 'performance':
          prompt += ' Focus specifically on performance indicators, loading states, progress feedback, and perceived responsiveness.';
          break;
        case 'onboarding':
          prompt += ' Focus specifically on onboarding elements, tutorials, first-time user experience, and feature discovery.';
          break;
      }
    }

    prompt += ' Include specific details about:';

    if (includeUXHeuristics) {
      prompt += ' Nielsen\'s 10 usability heuristics evaluation; visibility of system status; match between system and real world; user control and freedom; consistency and standards; error prevention; recognition rather than recall; flexibility and efficiency of use; aesthetic and minimalist design; help users diagnose and recover from errors; help and documentation;';
    }

    prompt += ' platform-specific UI components and patterns; compliance with platform design guidelines (Human Interface Guidelines for iOS, Material Design for Android); gesture support and interaction patterns; information architecture and content organization; state management and feedback mechanisms; responsive design and device compatibility; visual design polish and attention to detail; potential usability issues and improvement recommendations; accessibility compliance and inclusive design practices; technical implementation observations and potential optimizations.';

    if (format === 'json') {
      prompt += ' Provide your analysis in a structured JSON format with the following schema: {"app_name": "string (if visible)", "platform": "ios/android/auto-detected", "screen_type": "description", "ui_design": {"visual_hierarchy": "evaluation", "color_scheme": "description", "typography": "evaluation", "spacing_and_layout": "evaluation", "components": "description"}, "navigation": {"pattern": "description", "ease_of_use": "evaluation", "platform_compliance": "evaluation"}, "content": {"organization": "evaluation", "clarity": "evaluation", "density": "evaluation"}, "interactions": {"gestures": "description", "feedback": "evaluation", "responsiveness": "evaluation"}, "platform_guidelines": {"compliance_score": "1-10", "violations": ["list"], "best_practices": ["list"]}, "accessibility": {"score": "1-10", "issues": ["list"], "positive_aspects": ["list"]}, "ux_heuristics": {"visibility_of_status": "evaluation", "match_real_world": "evaluation", "user_control": "evaluation", "consistency": "evaluation", "error_prevention": "evaluation", "recognition_recall": "evaluation", "flexibility_efficiency": "evaluation", "aesthetic_design": "evaluation", "error_recovery": "evaluation", "help_documentation": "evaluation"}, "usability": {"strengths": ["list"], "issues": ["list"], "recommendations": ["list"]}, "technical_notes": "technical observations"}';
    }

    // Analyze the mobile app screenshot
    const result = await openRouterClient.analyzeImage(
      processedImage.data,
      processedImage.mimeType,
      prompt,
      { format, maxTokens }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze mobile app screenshot');
    }

    logger.info(`Mobile app screenshot analysis completed successfully`, {
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
    logger.error('Mobile app screenshot analysis failed', error);
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