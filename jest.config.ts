import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/tests/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/*",
    "!src/components/**/*",
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 70, statements: 70 },
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;
