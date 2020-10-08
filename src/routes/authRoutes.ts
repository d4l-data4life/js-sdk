import config from '../config/index';

const authRoutes = {
  fetchAccessToken(userId: string) {
    const query = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      owner: userId,
    };

    return ['POST', `${config.apiUrl()}/oauth/token`, { query, authorize: true }];
  },
};

export default authRoutes;
