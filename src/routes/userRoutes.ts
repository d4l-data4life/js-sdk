import config from '../config/index';
import d4lRequest from '../lib/d4lRequest';
import { SymKey } from '../services/userService';

const userRoutes = {
  resolveUserId(d4lUserAlias: string) {
    const body = { value: d4lUserAlias };
    return d4lRequest.submit('POST', `${config.apiUrl()}/users/resolve`, {
      body,
    });
  },

  getUserDetails(userId: string) {
    return d4lRequest.submit('GET', `${config.userUrl(userId)}`, {
      authorize: true,
    });
  },

  fetchUserInfo(userId: string) {
    return d4lRequest.submit('GET', `${config.apiUrl()}/userinfo`, {
      authorize: true,
      ownerId: userId,
    });
  },

  updateUser(userId: string, userData: Record<string, any>) {
    return d4lRequest.submit('PUT', `${config.userUrl(userId)}`, {
      body: userData,
      authorize: true,
    });
  },

  getReceivedPermissions(userId: string) {
    return d4lRequest.submit('GET', `${config.userUrl(userId)}/permissions`, {
      authorize: true,
    });
  },

  getCAPs(appId: string) {
    return d4lRequest.submit('GET', `${config.apiUrl()}/permissions`, {
      authorize: true,
      query: { app_id: appId },
    });
  },

  grantPermission(
    ownerId: string,
    granteeId: string,
    appId: string,
    commonKey: SymKey,
    scope: string[]
  ) {
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
