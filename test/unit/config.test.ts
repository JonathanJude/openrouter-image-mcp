import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Config } from '../../src/config/index.js';

describe('Config', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };

    // Clear any existing instance by resetting the singleton
    (Config as any).instance = undefined;

    // Set required environment variables for testing
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.OPENROUTER_MODEL = 'test-model';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Reset singleton instance
    (Config as any).instance = undefined;
  });

  it('should throw error when OPENROUTER_API_KEY is missing', () => {
    delete process.env.OPENROUTER_API_KEY;

    expect(() => {
      Config.getInstance();
    }).toThrow('OPENROUTER_API_KEY environment variable is required');
  });

  it('should use default values when optional environment variables are not set', () => {
    // Remove the model to test default behavior
    delete process.env.OPENROUTER_MODEL;

    const config = Config.getInstance();

    const openRouterConfig = config.getOpenRouterConfig();
    const serverConfig = config.getServerConfig();

    expect(openRouterConfig.model).toBe('anthropic/claude-3.5-sonnet');
    expect(openRouterConfig.baseUrl).toBe('https://openrouter.ai/api/v1');

    expect(serverConfig.port).toBe(3000);
    expect(serverConfig.logLevel).toBe('info');
    expect(serverConfig.retryAttempts).toBe(3);
    expect(serverConfig.maxImageSize).toBe(10485760);
  });

  it('should use custom values when environment variables are set', () => {
    // Reset singleton and set custom environment variables
    (Config as any).instance = undefined;
    process.env.OPENROUTER_MODEL = 'custom-model';
    process.env.OPENROUTER_BASE_URL = 'https://custom.api.com';
    process.env.PORT = '8080';
    process.env.LOG_LEVEL = 'debug';
    process.env.RETRY_ATTEMPTS = '5';
    process.env.MAX_IMAGE_SIZE = '20971520';

    const config = Config.getInstance();

    const openRouterConfig = config.getOpenRouterConfig();
    const serverConfig = config.getServerConfig();

    expect(openRouterConfig.model).toBe('custom-model');
    expect(openRouterConfig.baseUrl).toBe('https://custom.api.com');

    expect(serverConfig.port).toBe(8080);
    expect(serverConfig.logLevel).toBe('debug');
    expect(serverConfig.retryAttempts).toBe(5);
    expect(serverConfig.maxImageSize).toBe(20971520);
  });

  it('should return singleton instance', () => {
    const config1 = Config.getInstance();
    const config2 = Config.getInstance();

    expect(config1).toBe(config2);
  });
});