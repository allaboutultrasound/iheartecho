// Standard OAuth 2.0 types
// Compatible with any OAuth 2.0 provider (Google, GitHub, Microsoft, etc.)

export interface OAuthTokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface OAuthUserInfoResponse {
  /** Unique identifier for the user from the provider (sub, id, login, etc.) */
  openId: string;
  name: string;
  email?: string | null;
  platform?: string | null;
  loginMethod?: string | null;
}
