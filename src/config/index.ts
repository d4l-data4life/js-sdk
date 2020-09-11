export const envConfig = {
  development: {
    api: 'https://api-phdp-dev.hpsgc.de',
  },
  sandbox: {
    api: 'https://api-phdp-sandbox.hpsgc.de',
  },
  staging: {
    api: 'https://api-staging.data4life.care',
  },
  production: {
    api: 'https://api.data4life.care',
  },
  local: {
    api: 'https://api.data4life.local',
  },
};

const config = {
  environmentConfig: {},
  apiUrl() {
    return this.environmentConfig.api;
  },
  userUrl(ownerId: string): string {
    return `${this.apiUrl()}/users/${ownerId}`;
  },
  rateLimit: 50, // 100, but divide by 2 to account for pre-flight requests
  userInfoPollInterval: 5 * 60, // check for new common keys every 5 minutes
};

export default config;
