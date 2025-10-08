#!/usr/bin/env node

// Test in a temp directory with no .env file
import { spawn } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing MCP server WITHOUT .env file...\n');

// Create temp directory
const tempDir = mkdtempSync(join(tmpdir(), 'mcp-test-'));
console.log(`Test directory: ${tempDir}\n`);

const env = {
  ...process.env,
  OPENROUTER_API_KEY: 'sk-or-v1-test-key-for-testing',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash-lite-preview-09-2025',
};

const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  env,
  cwd: tempDir, // Run in temp dir with no .env
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  const text = data.toString().trim();
  output += text;
  console.log('STDOUT:', text);
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString().trim();
  errorOutput += text;
  console.log('STDERR:', text);
});

setTimeout(() => {
  console.log('\n--- Test Results ---');
  
  if (output.includes('OpenRouter Image MCP Server started successfully')) {
    console.log('✅ SUCCESS: Server works without .env file');
    console.log('✅ MCP config environment variables are sufficient');
  } else if (errorOutput.includes('OPENROUTER_API_KEY')) {
    console.log('❌ FAILED: Server requires .env file');
  } else {
    console.log('⚠️  Check output above');
  }
  
  serverProcess.kill('SIGTERM');
  rmSync(tempDir, { recursive: true });
  process.exit(0);
}, 3000);
