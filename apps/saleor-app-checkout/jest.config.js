/* eslint-disable import/no-anonymous-default-export */
const { pathsToModuleNameMapper } = require("ts-jest");
const requireJSON = require("json-easy-strip");
const { compilerOptions } = requireJSON("./tsconfig.json");

delete compilerOptions.paths["react"];

module.exports = {
  clearMocks: false,
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "ts-jest/presets/default-esm",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
    "^lodash-es/(.*)$": "lodash/$1",
  },
  setupFiles: ["./setupTestsBeforeEnv.ts"],
  setupFilesAfterEnv: ["./setupTestsAfterEnv.ts"],
  testEnvironment: "setup-polly-jest/jest-environment-node",
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!lodash-es)"],
};
