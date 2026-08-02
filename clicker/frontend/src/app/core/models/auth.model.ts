export interface AuthUser {
  id: number;
  email: string;
  isVip: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}
