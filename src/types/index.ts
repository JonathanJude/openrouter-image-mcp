export interface ImageAnalysisOptions {
  format?: 'text' | 'json';
  prompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ImageInput {
  type: 'base64' | 'file' | 'url';
  data: string;
  mimeType?: string;
}

export interface ImageAnalysisResult {
  success: boolean;
  analysis?: string;
  structuredData?: any;
  error?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ServerConfig {
  port?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  retryAttempts?: number;
  maxImageSize?: number;
}