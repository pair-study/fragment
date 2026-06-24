/** @type {import('jest').Config} */
module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@fragment/database$": "<rootDir>/../../packages/database/src",
    "^@fragment/shared$": "<rootDir>/../../packages/shared/src",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
};
