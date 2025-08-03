export {};
// Development login utility for bypassing authentication in dev mode
export interface DevLoginCredentials {
  email: string;
  password: string;
  bypass: boolean;
}

export function createDevLoginBypass(): DevLoginCredentials {
  return {
    email: 'dev@aspcranes.com',
    password: 'dev123',
    bypass: true
  };
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function shouldAllowDevBypass(): boolean {
  return isDevMode() && process.env.ALLOW_DEV_BYPASS === 'true';
}

