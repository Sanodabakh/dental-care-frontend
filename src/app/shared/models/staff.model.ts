export type StaffRole = 'ADMIN' | 'DENTIST' | 'SECRETARY' | 'CASHIER' | 'STOCK_MANAGER' | 'ASSISTANT';

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  specialty?: string;
  active: boolean;
  hiredAt: string;
}

export interface StaffCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  specialty?: string;
}