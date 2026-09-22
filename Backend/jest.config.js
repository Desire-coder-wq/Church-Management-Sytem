module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: ['.*\\.spec\\.ts$', '.*\\.e2e-spec\\.ts$'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/controllers.ts',
    '!src/services.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/test/setup.ts'],
};