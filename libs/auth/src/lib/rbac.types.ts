export type Role = 'admin' | 'manager' | 'user';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
}
