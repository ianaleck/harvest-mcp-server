/**
 * Configuration Unit Tests
 */

describe('Config', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
    
    // Clear module cache to force re-import
    jest.resetModules();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should load configuration successfully with valid environment variables', async () => {
    // Set valid environment variables
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';

    const { appConfig } = await import('../../../src/config');

    expect(appConfig).toBeDefined();
    expect(appConfig.harvest.accessToken).toBe('test_token');
    expect(appConfig.harvest.accountId).toBe('test_account');
    expect(appConfig.harvest.baseUrl).toBe('https://api.harvestapp.com/v2');
    expect(appConfig.env).toBe('test'); // NODE_ENV should be 'test' in test environment
  });

  it('should use default values for optional environment variables', async () => {
    // Set only required environment variables
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;

    const { appConfig } = await import('../../../src/config');

    expect(appConfig.env).toBe('development'); // Default NODE_ENV
    expect(appConfig.logging.level).toBe('info'); // Default LOG_LEVEL
    expect(appConfig.http.timeout).toBe(30000); // Default timeout
    expect(appConfig.http.maxRetries).toBe(3); // Default retries
  });

  it('should throw error when required environment variables are missing', async () => {
    // Remove required environment variables
    delete process.env.HARVEST_ACCESS_TOKEN;
    delete process.env.HARVEST_ACCOUNT_ID;

    await expect(async () => {
      await import('../../../src/config');
    }).rejects.toThrow('Environment validation failed:');
  });

  it('should throw error with detailed message for missing HARVEST_ACCESS_TOKEN', async () => {
    // Set some variables but miss HARVEST_ACCESS_TOKEN
    process.env.HARVEST_ACCOUNT_ID = 'test_account';
    delete process.env.HARVEST_ACCESS_TOKEN;

    await expect(async () => {
      await import('../../../src/config');
    }).rejects.toThrow(/HARVEST_ACCESS_TOKEN.*Required/);
  });

  it('should throw error with detailed message for missing HARVEST_ACCOUNT_ID', async () => {
    // Set some variables but miss HARVEST_ACCOUNT_ID
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    delete process.env.HARVEST_ACCOUNT_ID;

    await expect(async () => {
      await import('../../../src/config');
    }).rejects.toThrow(/HARVEST_ACCOUNT_ID.*Required/);
  });

  it('should validate NODE_ENV values correctly', async () => {
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';
    process.env.NODE_ENV = 'production';

    const { appConfig } = await import('../../../src/config');

    expect(appConfig.env).toBe('production');
    expect(appConfig.isProduction).toBe(true);
    expect(appConfig.isDevelopment).toBe(false);
    expect(appConfig.isTest).toBe(false);
  });

  it('should handle invalid NODE_ENV values', async () => {
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';
    process.env.NODE_ENV = 'invalid_env' as any;

    await expect(async () => {
      await import('../../../src/config');
    }).rejects.toThrow('Environment validation failed:');
  });

  it('should parse numeric configuration values correctly', async () => {
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';
    process.env.REQUEST_TIMEOUT_MS = '45000';
    process.env.MAX_RETRIES = '5';

    const { appConfig } = await import('../../../src/config');

    expect(appConfig.http.timeout).toBe(45000);
    expect(appConfig.http.maxRetries).toBe(5);
  });

  it('should generate correct user agent string', async () => {
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';

    const { appConfig } = await import('../../../src/config');

    expect(appConfig.harvest.userAgent).toMatch(/harvest-mcp-server\/0\.1\.0 \(Node\.js v\d+\.\d+\.\d+\)/);
  });

  it('should export constants correctly', async () => {
    process.env.HARVEST_ACCESS_TOKEN = 'test_token';
    process.env.HARVEST_ACCOUNT_ID = 'test_account';

    const { HARVEST_API_BASE_URL } = await import('../../../src/config');

    expect(HARVEST_API_BASE_URL).toBe('https://api.harvestapp.com/v2');
  });
});