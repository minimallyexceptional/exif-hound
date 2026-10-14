/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.ts', '**/src/**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        target: 'es2021',
        strict: true,
        lib: ['ES2021', 'DOM'],
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
};
