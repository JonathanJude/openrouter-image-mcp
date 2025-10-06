import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { Config } from '../config/index.js';
import { OpenRouterClient } from '../utils/openrouter-client.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { Logger } from '../utils/logger.js';

export function registerAnalyzeMobileAppTool(server: Server): void {
  const config = Config.getInstance();
  const openRouterClient = OpenRouterClient.getInstance(config.getOpenRouterConfig());
  const imageProcessor = ImageProcessor.getInstance();
  const logger = Logger.getInstance();

  const tool: Tool = {
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
      const imageInput = {
        type: args.type as 'base64' | 'file' | 'url',
        data: args.data as string,
        mimeType: args.mimeType as string,
      };

      const platform = args.platform as string || 'auto-detect';
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
      let prompt = 'Analyze this mobile app screenshot and provide detailed insights about its design, user experience, and functionality.';

      if (platform !== 'auto-detect') {
        prompt += ` Focus on ${platform} platform conventions and design patterns.`;
      } else {
        prompt += ' Identify the mobile platform (iOS/Android) and analyze according to its specific conventions.';
      }

      if (focusArea) {
        switch (focusArea) {
          case 'ui-design':
            prompt += ' Focus specifically on UI design elements, visual hierarchy, typography, color scheme, spacing, and adherence to platform design guidelines.';
            break;
          case 'user-experience':
            prompt += ' Focus specifically on user experience, user flow, interaction patterns, and overall usability.';
            break;
          case 'navigation':
            prompt += ' Focus specifically on navigation patterns, menu structures, tabs, and user pathway efficiency.';
            break;
          case 'accessibility':
            prompt += ' Focus specifically on accessibility features, contrast ratios, touch targets, screen reader compatibility, and inclusive design.';
            break;
          case 'performance':
            prompt += ' Focus specifically on performance indicators, loading states, network connectivity cues, and optimization opportunities.';
            break;
          case 'onboarding':
            prompt += ' Focus specifically on onboarding elements, tutorials, tooltips, and user guidance features.';
            break;
        }
      }

      prompt += ' Include detailed analysis of:';

      if (includeUXHeuristics) {
        prompt += ' UX heuristic evaluation (visibility of system status, match between system and real world, user control and freedom, consistency and standards, error prevention, recognition rather than recall, flexibility and efficiency of use, aesthetic and minimalist design, help users recognize diagnose and recover from errors, help and documentation);';
      }

      prompt += ' platform-specific design patterns and conventions; component library usage and custom elements; information architecture and content organization; interactive elements and affordances; potential usability issues and improvement suggestions; accessibility compliance and inclusive design considerations; technical implementation insights (layout, animations, gestures); visual design quality and brand consistency; performance and loading considerations; error states and edge cases handling.';

      if (format === 'json') {
        prompt += ' Provide your analysis in a structured JSON format with the following schema: {"app_info": {"platform": "iOS/Android", "app_name": "if identifiable", "screen_type": "type of screen"}, "ui_analysis": {"design_system": "description", "typography": "analysis", "color_scheme": "description", "spacing_layout": "analysis", "visual_hierarchy": "description"}, "navigation": {"primary_navigation": "description", "secondary_navigation": "description", "user_flow": "analysis", "breadcrumbs_breadcrumbs": "if applicable"}, "interactive_elements": {"buttons": ["list"], "forms": ["list"], "gestures": ["list"], "animations": "description"}, "accessibility": {"score": "1-10", "touch_targets": "analysis", "contrast": "analysis", "screen_reader": "analysis", "inclusive_design": "comments"}, "ux_heuristics": {"visibility_of_system_status": "score/analysis", "match_real_world": "score/analysis", "user_control": "score/analysis", "consistency": "score/analysis", "error_prevention": "score/analysis", "recognition_recall": "score/analysis", "flexibility_efficiency": "score/analysis", "aesthetic_design": "score/analysis", "error_recovery": "score/analysis", "help_documentation": "score/analysis"}, "usability_issues": ["list of identified issues"], "improvement_suggestions": ["list of actionable suggestions"], "technical_observations": "technical implementation notes", "overall_assessment": "summary of quality and effectiveness"}';
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
  });

  logger.info('analyze_mobile_app_screenshot tool registered');
}