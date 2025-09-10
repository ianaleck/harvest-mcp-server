import './matchers/harvest-matchers';

export {};

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  
  process.env.HARVEST_ACCESS_TOKEN = process.env.HARVEST_ACCESS_TOKEN || 'test_token_12345';
  process.env.HARVEST_ACCOUNT_ID = process.env.HARVEST_ACCOUNT_ID || '123456';
  
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  jest.clearAllMocks();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});