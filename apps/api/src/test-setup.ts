// Global test setup to manage memory between test files

// Note: Jest 30's globalsCleanup: 'on' already handles global cleanup between test files
// This file provides additional memory management optimizations

// Force garbage collection after each test suite if available
if (global.gc && typeof global.gc === 'function') {
  afterAll(() => {
    // Force garbage collection after all tests in a file complete
    // This helps free memory before loading the next test file
    global.gc();
  });
}
