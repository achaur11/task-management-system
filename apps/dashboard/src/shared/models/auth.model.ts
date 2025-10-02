export interface User {
  id: string;
  email: string;
  displayName: string;
  orgId: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  orgId: string;
  role?: string;
}

export interface RegisterResponse {
  user: User;
}
