module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        esModuleInterop: true,
      }
    }]
  },
  moduleNameMapper: {
    '^exif-hound-core/workers/exif$': '<rootDir>/../../packages/exif-hound-core/src/workers/exif.ts',
    '^exif-hound-core/workers/image-processing$': '<rootDir>/../../packages/exif-hound-core/src/workers/image-processing.ts',
    '^exif-hound-core/desktop$': '<rootDir>/../../packages/exif-hound-core/dist/desktop.cjs',
    '^exif-hound-core$': '<rootDir>/../../packages/exif-hound-core/dist/index.cjs',
    '\\?worker&url$': '<rootDir>/src/__mocks__/fileMock.cjs',
    '\\?url$': '<rootDir>/src/__mocks__/fileMock.cjs',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.cjs',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__mocks__/**',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    // Global thresholds are intentionally low as we're just starting to add tests
    // These should be increased as test coverage improves
    global: {
      statements: 3,
      branches: 2,
      functions: 1,
      lines: 3
    },
    'src/utils/date.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    },
    'src/components/evidence/EvidenceView.tsx': {
      statements: 95,
      branches: 88,
      functions: 100,
      lines: 100
    },
    'src/components/evidence/EvidenceCategoryTable.tsx': {
      statements: 95,
      branches: 75,
      functions: 100,
      lines: 95
    }
  }
}; 