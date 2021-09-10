import axios, { AxiosRequestConfig } from 'axios';

// Check API Key for public action
export async function apiKeyCheck(permission: Permission, token: string) {

  const servicePort = process.env.AI_ADMIN_SERVICE_PORT || 3000;
  const url = `http://ai-admin.ai-admin.svc.cluster.local:${servicePort}/api/api-keys/verify`;

  const options = {
    headers: {
      'Content-type': 'application/json',
      'x-api-token': token
    }
  } as AxiosRequestConfig;

  const result = await axios.post(url, permission, options);
  return result.data;
}

export interface Permission {
  name: string;
  write: boolean;
}
