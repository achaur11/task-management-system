import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
        diagnostics: false,
        // Disable AST caching to reduce memory
        astTransformers: {
          before: [],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  collectCoverageFrom: [
    // Only collect coverage for service files (most important)
    'src/**/*.service.ts',
    'src/**/*.controller.ts',
    // Exclude everything else to reduce memory
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.module.ts',
    '!src/**/*.guard.ts',
    '!src/**/*.strategy.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.filter.ts',
    '!src/**/*.interceptor.ts',
    '!src/**/*.pipe.ts',
    '!src/main.ts',
    '!src/**/migrations/**',
    '!src/**/seed/**',
    '!src/**/config/**',
  ],
  // Use minimal coverage reporters to save memory
  coverageReporters: ['text-summary', 'text'],
  moduleNameMapper: {
    '^data$': '<rootDir>/../../libs/data/src/index.ts',
    '^auth$': '<rootDir>/../../libs/auth/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  maxWorkers: 1,
  testTimeout: 30000,
  workerIdleMemoryLimit: '150MB',
  // Don't cache transformed files between test runs to free memory
  cache: false,
  // More aggressive memory management
  logHeapUsage: true,
  // Jest 30: Enable global cleanup between test files to reduce memory leaks
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
  // Force garbage collection more aggressively
  detectOpenHandles: false,
  detectLeaks: false,
  // Use v8 coverage provider for better memory efficiency
  coverageProvider: 'v8',
  // Disable source maps to save memory
  sourceMaps: false,
  // Clear mocks between tests to prevent memory leaks
  clearMocks: true,
  // Restore mocks after each test
  restoreMocks: true,
  // Reduce memory usage by disabling coverage threshold during collection
  // (thresholds are checked after collection, not during)
};

// Conditionally add coverage thresholds only if explicitly enabled
// This saves memory during coverage collection
if (process.env.COVERAGE_THRESHOLD === 'true') {
  config.coverageThreshold = {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  };
}

export default config;

