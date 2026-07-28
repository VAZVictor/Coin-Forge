export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}
