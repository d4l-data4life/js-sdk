import config from 'config';

const authRoutes = {
  fetchAccessToken(userId) {
    const query = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      owner: userId,
    };

    return ['POST', `${config.apiUrl()}/oauth/token`, { query, authorize: true }];
  },
};

export default authRoutes;
