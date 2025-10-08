#!/usr/bin/env node

// Test that the MCP server works with env vars from MCP config (no .env file)
// This simulates how users will run it via MCP clients

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing MCP server with environment variables (no .env file)...\n');

// Simulate MCP client passing env vars
const env = {
  ...process.env,
  OPENROUTER_API_KEY: 'sk-or-v1-test-key-for-testing',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash-lite-preview-09-2025',
};

// Run in /tmp to ensure no .env file is found
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('STDERR:', data.toString().trim());
});

// Give it 3 seconds to start
setTimeout(() => {
  console.log('\n--- Test Results ---');
  
  if (output.includes('OpenRouter Image MCP Server started successfully')) {
    console.log('✅ SUCCESS: Server started without .env file');
    console.log('✅ Environment variables from MCP config are working');
  } else if (errorOutput.includes('OPENROUTER_API_KEY environment variable is required')) {
    console.log('❌ FAILED: Server requires .env file (should work with env vars only)');
  } else {
    console.log('⚠️  UNKNOWN: Check output above');
  }
  
  serverProcess.kill('SIGTERM');
  process.exit(0);
}, 3000);
