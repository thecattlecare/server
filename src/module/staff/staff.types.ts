export interface CreateStaffInput {
  fullName: string;
  cnic: string;
  phoneNumber: string;
  address: string;
  joiningDate: Date;
  currentSalary: number;
  role: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateStaffInput {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  currentSalary?: number;
  role?: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateSalaryInput {
  newSalary: number;
  reason?: string;
}

export interface CreateMonthlyPaymentInput {
  staffId: string;
  month: string;
  year: number;
  amount: number;
  status?: 'Paid' | 'Pending' | 'Partial';
  paymentDate?: Date;
  remarks?: string;
}

export interface UpdateMonthlyPaymentInput {
  status?: 'Paid' | 'Pending' | 'Partial';
  paymentDate?: Date;
  remarks?: string;
}

export interface StaffFilters {
  role?: string;
  status?: 'Active' | 'Inactive';
  search?: string;
}

export interface Role {
  name: string;
  permissions?: string[];
  description?: string;
}