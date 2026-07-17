import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

import path from 'path';

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  rootDir: path.resolve(__dirname),
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);