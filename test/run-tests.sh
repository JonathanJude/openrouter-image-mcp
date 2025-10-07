#!/bin/bash

# Comprehensive test runner for OpenRouter Image MCP

set -e

echo "🧪 Running OpenRouter Image MCP Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run test with proper error handling
run_test() {
    local test_name=$1
    local test_command=$2

    echo -e "${YELLOW}Running: ${test_name}${NC}"

    if eval "$test_command"; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}"
        return 0
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        return 1
    fi
}

# Test environment setup
echo "Setting up test environment..."
export NODE_ENV=test
export LOG_LEVEL=error

# Check if dependencies are installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run different test suites
FAILED_TESTS=()

echo ""
echo "🔬 Unit Tests"
echo "------------"

# Run unit tests
if ! run_test "Unit Tests" "npm run test unit"; then
    FAILED_TESTS+=("unit")
fi

echo ""
echo "🌐 Integration Tests"
echo "--------------------"

# Run integration tests
if ! run_test "Integration Tests" "npm run test integration"; then
    FAILED_TESTS+=("integration")
fi

echo ""
echo "⚡ Edge Cases Tests"
echo "-------------------"

# Run edge case tests
if ! run_test "Edge Cases" "npm run test edge-cases"; then
    FAILED_TESTS+=("edge-cases")
fi

echo ""
echo "📊 Meta Guy Image Tests"
echo "-----------------------"

# Run meta guy specific tests
if ! run_test "Meta Guy Analysis" "npm run test meta-guy"; then
    FAILED_TESTS+=("meta-guy")
fi

echo ""
echo "🎯 All Tests"
echo "------------"

# Run all tests with coverage
if ! run_test "All Tests with Coverage" "npm run test:coverage"; then
    FAILED_TESTS+=("coverage")
fi

# Generate test report
echo ""
echo "📋 Test Summary"
echo "==============="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"

    # Show coverage summary if available
    if [ -f "coverage/coverage-summary.json" ]; then
        echo ""
        echo "📊 Coverage Summary:"
        node -e "
        const coverage = require('./coverage/coverage-summary.json');
        console.log('Lines: ' + coverage.total.lines.pct + '%');
        console.log('Functions: ' + coverage.total.functions.pct + '%');
        console.log('Branches: ' + coverage.total.branches.pct + '%');
        console.log('Statements: ' + coverage.total.statements.pct + '%');
        "
    fi

    exit 0
else
    echo -e "${RED}❌ Some tests failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}- $test${NC}"
    done

    echo ""
    echo "🔍 To debug failed tests, run:"
    echo "npm run test -- --reporter=verbose"
    echo ""
    echo "Or run specific test files:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "npm run test -- $test"
    done

    exit 1
fi
fi