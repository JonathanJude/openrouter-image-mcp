import { vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Mock environment variables for all tests
  process.env.OPENROUTER_API_KEY = 'test-api-key';
  process.env.OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';
  // Don't set LOG_LEVEL globally to allow tests to control it
});

// Global test teardown
afterEach(() => {
  vi.clearAllMocks();
});