import axios, { AxiosInstance } from 'axios';
import { ImageAnalysisResult, OpenRouterConfig } from '../types/index.js';
import { Logger } from './logger.js';

export class OpenRouterClient {
  private static instance: OpenRouterClient;
  private client: AxiosInstance;
  private config: OpenRouterConfig;
  private logger: Logger;

  private constructor(config: OpenRouterConfig) {
    this.config = config;
    this.logger = Logger.getInstance();

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/openrouter-image-mcp',
        'X-Title': 'OpenRouter Image MCP',
      },
      timeout: 120000, // 120 seconds - increased timeout for large images
      maxContentLength: 50 * 1024 * 1024, // 50MB max content length
      maxBodyLength: 50 * 1024 * 1024, // 50MB max body length
    });
  }

  public static getInstance(config: OpenRouterConfig): OpenRouterClient {
    if (!OpenRouterClient.instance) {
      OpenRouterClient.instance = new OpenRouterClient(config);
    }
    return OpenRouterClient.instance;
  }

  public async validateModel(modelId: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating model: ${modelId}`);

      const response = await this.client.get('/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      const models = response.data.data || [];
      const modelExists = models.some((model: any) => model.id === modelId);

      if (!modelExists) {
        this.logger.warn(`Model not found: ${modelId}`);
        return false;
      }

      // Check if model supports vision
      const model = models.find((m: any) => m.id === modelId);
      const modelLower = modelId.toLowerCase();
      const supportsVision = model?.architecture?.modality?.includes('vision') ||
                            model?.architecture?.modality?.includes('image') ||
                            model?.capabilities?.vision ||
                            modelLower.includes('vision') ||
                            modelLower.includes('claude-3') ||
                            modelLower.includes('claude-3.5') ||
                            modelLower.includes('gpt-4-vision') ||
                            modelLower.includes('gpt-4o') ||
                            modelLower.includes('gemini') ||
                            modelLower.includes('llama-3.2-90b-vision') ||
                            modelLower.includes('llama-3.2-11b-vision');

      if (!supportsVision) {
        this.logger.warn(`Model may not support vision: ${modelId}`);
      }

      this.logger.debug(`Model validation completed: ${modelId}, supports vision: ${supportsVision}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to validate model ${modelId}`, error);
      return false;
    }
  }

  public async analyzeImage(
    imageData: string,
    mimeType: string,
    prompt: string,
    options: {
      format?: 'text' | 'json';
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ImageAnalysisResult> {
    try {
      this.logger.debug(`Analyzing image with model: ${this.config.model}`);

      // Validate inputs
      if (!imageData || imageData.length === 0) {
        throw new Error('No image data provided');
      }

      if (!mimeType) {
        throw new Error('No MIME type provided');
      }

      // Check image data size (base64 encoded)
      if (imageData.length > 20 * 1024 * 1024) { // 20MB base64 limit
        throw new Error(`Image data too large: ${imageData.length} characters. Maximum allowed is 20MB.`);
      }

      // Validate prompt length
      const promptText = prompt || 'Analyze this image in detail. Describe what you see, including objects, people, text, and any notable features.';
      if (promptText.length > 10000) {
        throw new Error(`Prompt too long: ${promptText.length} characters. Maximum allowed is 10000.`);
      }

      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`,
                },
              },
            ],
          },
        ],
        max_tokens: Math.min(options.maxTokens || 4000, 8000), // Cap at 8000 tokens
        temperature: options.temperature || 0.1,
        response_format: options.format === 'json' ? { type: 'json_object' } : undefined,
      };

      this.logger.debug(`Sending request to OpenRouter API`, {
        model: this.config.model,
        imageSize: imageData.length,
        promptLength: promptText.length,
        maxTokens: requestBody.max_tokens,
      });

      const response = await this.client.post('/chat/completions', requestBody);

      const choice = response.data.choices?.[0];
      if (!choice) {
        throw new Error('No response from model');
      }

      const content = choice.message?.content;
      if (!content) {
        throw new Error('Empty response from model');
      }

      let analysis: string;
      let structuredData: any;

      if (options.format === 'json') {
        try {
          structuredData = JSON.parse(content);
          analysis = JSON.stringify(structuredData, null, 2);
        } catch {
          // If JSON parsing fails, treat as text
          analysis = content;
          structuredData = { analysis: content };
        }
      } else {
        analysis = content;
        structuredData = { analysis };
      }

      const usage = response.data.usage;

      this.logger.info(`Image analysis completed successfully`, {
        model: this.config.model,
        usage,
      });

      return {
        success: true,
        analysis,
        structuredData,
        model: this.config.model,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to analyze image', error);

      const errorMessage = this.extractErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private extractErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (data?.error?.message) {
        return `OpenRouter API Error: ${data.error.message}`;
      }
      if (data?.message) {
        return `OpenRouter API Error: ${data.message}`;
      }
      return `HTTP ${error.response?.status}: ${error.message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      this.logger.error('Failed to connect to OpenRouter API', error);
      return false;
    }
  }
}