import config from 'config';
import d4lRequest from '../lib/d4lRequest';

const userRoutes = {
  resolveUserId(d4lUserAlias) {
    const body = { value: d4lUserAlias };
    return d4lRequest.submit('POST', `${config.apiUrl()}/users/resolve`, {
      body,
    });
  },

  getUserDetails(userId) {
    return d4lRequest.submit('GET', `${config.userUrl(userId)}`, {
      authorize: true,
    });
  },

  fetchUserInfo(userId) {
    return d4lRequest.submit('GET', `${config.apiUrl()}/userinfo`, {
      authorize: true,
      ownerId: userId,
    });
  },

  updateUser(userId, userData) {
    return d4lRequest.submit('PUT', `${config.userUrl(userId)}`, {
      body: userData,
      authorize: true,
    });
  },

  getReceivedPermissions(userId) {
    return d4lRequest.submit('GET', `${config.userUrl(userId)}/permissions`, {
      authorize: true,
    });
  },

  getCommonKey(userId, commonKeyId) {
    return d4lRequest.submit('GET', `${config.userUrl(userId)}/commonkeys/${commonKeyId}`, {
      authorize: true,
    });
  },

  getCAPs(appId) {
    return d4lRequest.submit('GET', `${config.apiUrl()}/permissions`, {
      authorize: true,
      query: { app_id: appId },
    });
  },

  grantPermission(ownerId, granteeId, appId, commonKey, scope) {
    const scopeString = scope.join(' ');
    const body = {
      grantee: granteeId,
      common_key: commonKey,
      app_id: appId,
      scope: scopeString,
    };
    return d4lRequest.submit('POST', `${config.userUrl(ownerId)}/permissions`, {
      body,
      authorize: true,
    });
  },
};

export default userRoutes;
