export interface ReauthSession {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}