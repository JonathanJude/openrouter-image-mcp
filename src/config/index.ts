import { config as loadEnv } from 'dotenv';
import { OpenRouterConfig, ServerConfig } from '../types/index.js';

export class Config {
  private static instance: Config;
  private openRouterConfig: OpenRouterConfig;
  private serverConfig: ServerConfig;

  private constructor() {
    // Load environment variables from .env file
    loadEnv();
    
    this.validateEnvironment();
    this.openRouterConfig = {
      apiKey: process.env.OPENROUTER_API_KEY!,
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    };

    this.serverConfig = {
      port: parseInt(process.env.PORT || '3000'),
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private validateEnvironment(): void {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  public getOpenRouterConfig(): OpenRouterConfig {
    return this.openRouterConfig;
  }

  public getServerConfig(): ServerConfig {
    return this.serverConfig;
  }
}