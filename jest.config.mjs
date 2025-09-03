// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?[jt]sx?$': 'babel-jest',
  },
  
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: [
    '**/*.test.mjs', 
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,

};