import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleSpy: {
    log: any;
    error: any;
    warn: any;
  };

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };

    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };

    // Reset singleton instance
    (Logger as any).instance = undefined;
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();

    // Reset singleton instance
    (Logger as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it('should use default log level when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;
      const logger = Logger.getInstance();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use custom log level when LOG_LEVEL is set', () => {
      process.env.LOG_LEVEL = 'debug';
      const logger = Logger.getInstance();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('log levels', () => {
    describe('when log level is debug', () => {
      beforeEach(() => {
        process.env.LOG_LEVEL = 'debug';
        (Logger as any).instance = undefined;
      });

      it('should log debug messages', () => {
        const logger = Logger.getInstance();
        logger.debug('Debug message', { key: 'value' });

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[DEBUG] Debug message {"key":"value"}')
        );
      });

      it('should log info messages', () => {
        const logger = Logger.getInstance();
        logger.info('Info message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('[INFO] Info message')
        );
      });

      it('should log warn messages', () => {
        const logger = Logger.getInstance();
        logger.warn('Warn message');

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('[WARN] Warn message')
        );
      });

      it('should log error messages', () => {
        const logger = Logger.getInstance();
        logger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR] Error message')
        );
      });
    });

    describe('when log level is info', () => {
      beforeEach(() => {
        process.env.LOG_LEVEL = 'info';
        (Logger as any).instance = undefined;
      });

      it('should not log debug messages', () => {
        const logger = Logger.getInstance();
        logger.debug('Debug message');

        expect(consoleSpy.error).not.toHaveBeenCalled();
      });

      it('should log info messages', () => {
        const logger = Logger.getInstance();
        logger.info('Info message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('[INFO] Info message')
        );
      });

      it('should log warn messages', () => {
        const logger = Logger.getInstance();
        logger.warn('Warn message');

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('[WARN] Warn message')
        );
      });

      it('should log error messages', () => {
        const logger = Logger.getInstance();
        logger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR] Error message')
        );
      });
    });

    describe('when log level is warn', () => {
      beforeEach(() => {
        process.env.LOG_LEVEL = 'warn';
        (Logger as any).instance = undefined;
      });

      it('should not log debug messages', () => {
        const logger = Logger.getInstance();
        logger.debug('Debug message');

        expect(consoleSpy.error).not.toHaveBeenCalled();
      });

      it('should not log info messages', () => {
        const logger = Logger.getInstance();
        logger.info('Info message');

        expect(consoleSpy.log).not.toHaveBeenCalled();
      });

      it('should log warn messages', () => {
        const logger = Logger.getInstance();
        logger.warn('Warn message');

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('[WARN] Warn message')
        );
      });

      it('should log error messages', () => {
        const logger = Logger.getInstance();
        logger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR] Error message')
        );
      });
    });

    describe('when log level is error', () => {
      beforeEach(() => {
        process.env.LOG_LEVEL = 'error';
        (Logger as any).instance = undefined;
      });

      it('should not log debug messages', () => {
        const logger = Logger.getInstance();
        logger.debug('Debug message');

        expect(consoleSpy.error).not.toHaveBeenCalled();
      });

      it('should not log info messages', () => {
        const logger = Logger.getInstance();
        logger.info('Info message');

        expect(consoleSpy.log).not.toHaveBeenCalled();
      });

      it('should not log warn messages', () => {
        const logger = Logger.getInstance();
        logger.warn('Warn message');

        expect(consoleSpy.warn).not.toHaveBeenCalled();
      });

      it('should log error messages', () => {
        const logger = Logger.getInstance();
        logger.error('Error message');

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR] Error message')
        );
      });
    });
  });

  describe('message formatting', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug';
      (Logger as any).instance = undefined;
    });

    it('should format messages with timestamp and level', () => {
      const logger = Logger.getInstance();
      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message$/)
      );
    });

    it('should include data when provided', () => {
      const logger = Logger.getInstance();
      logger.info('Test message', { key1: 'value1', key2: 42 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test message {"key1":"value1","key2":42}')
      );
    });

    it('should not include data when not provided', () => {
      const logger = Logger.getInstance();
      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message$/)
      );
    });

    it('should handle errors with stack traces', () => {
      const logger = Logger.getInstance();
      const error = new Error('Test error');

      logger.error('Error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred')
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error')
      );
    });

    it('should handle errors without stack traces', () => {
      const logger = Logger.getInstance();
      const error = { message: 'Plain error object' };

      logger.error('Error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred')
      );
      expect(consoleSpy.error).toHaveBeenCalledTimes(1); // No stack trace logged
    });
  });
});