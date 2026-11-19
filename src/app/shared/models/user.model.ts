export type UserRole = 'ADMIN' | 'DENTIST' | 'SECRETARY' | 'CASHIER' | 'STOCK_MANAGER' | 'ASSISTANT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}
