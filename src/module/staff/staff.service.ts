import { Staff, MonthlyPayment } from './staff.model';
import { CreateStaffInput, UpdateStaffInput, UpdateSalaryInput, CreateMonthlyPaymentInput, UpdateMonthlyPaymentInput, StaffFilters } from './staff.types';

export class StaffService {
  // Role Management - Store roles as a class property
  private roles: Map<string, any>;
  
  constructor() {
    this.roles = new Map();
    // Initialize default roles
    this.roles.set('Manager', { name: 'Manager', description: 'Manages all farm operations' });
    this.roles.set('Doctor', { name: 'Doctor', description: 'Handles animal health and treatment' });
    this.roles.set('Worker', { name: 'Worker', description: 'Performs daily farm tasks' });
  }

  // Staff CRUD Operations
  async createStaff(data: CreateStaffInput) {
    try {
      const existingStaff = await Staff.findOne({ cnic: data.cnic });
      if (existingStaff) {
        throw new Error('Staff with this CNIC already exists');
      }
      
      const staff = new Staff(data);
      await staff.save();
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getAllStaff(filters: StaffFilters = {}) {
    try {
      const query: any = {};
      
      if (filters.role) query.role = filters.role;
      if (filters.status) query.status = filters.status;
      if (filters.search) {
        query.$or = [
          { fullName: { $regex: filters.search, $options: 'i' } },
          { phoneNumber: { $regex: filters.search, $options: 'i' } },
          { cnic: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      const staff = await Staff.find(query).sort({ createdAt: -1 });
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getStaffById(id: string) {
    try {
      const staff = await Staff.findById(id);
      if (!staff) {
        throw new Error('Staff not found');
      }
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async updateStaff(id: string, data: UpdateStaffInput) {
    try {
      const staff = await Staff.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!staff) {
        throw new Error('Staff not found');
      }
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async updateSalary(id: string, data: UpdateSalaryInput) {
    try {
      const staff = await Staff.findById(id);
      if (!staff) {
        throw new Error('Staff not found');
      }
      
      const previousSalary = staff.currentSalary;
      staff.salaryHistory.push({
        previousSalary,
        newSalary: data.newSalary,
        effectiveDate: new Date(),
        reason: data.reason
      });
      staff.currentSalary = data.newSalary;
      await staff.save();
      
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async deleteStaff(id: string) {
    try {
      const staff = await Staff.findByIdAndDelete(id);
      if (!staff) {
        throw new Error('Staff not found');
      }
      return staff;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Monthly Payment Operations
  async createMonthlyPayment(data: CreateMonthlyPaymentInput) {
  // Check if payment already exists for this staff/month/year
  const existing = await MonthlyPayment.findOne({
    staffId: data.staffId,
    month: data.month,
    year: data.year
  });
  
  if (existing) {
    // Add the new amount to existing payment
    const newAmount = existing.amount + data.amount;
    
    // Get staff salary to determine status
    const staff = await Staff.findById(data.staffId);
    const monthlySalary = staff?.currentSalary || 0;
    
    // Determine new status based on total paid
    let newStatus = existing.status;
    if (newAmount >= monthlySalary) {
      newStatus = 'Paid';
    } else if (newAmount > 0 && newAmount < monthlySalary) {
      newStatus = 'Partial';
    }
    
    // Update existing payment
    existing.amount = newAmount;
    existing.status = newStatus;
    if (data.paymentDate) {
      existing.paymentDate = data.paymentDate;
    }
    if (data.remarks) {
      existing.remarks = existing.remarks 
        ? `${existing.remarks}\n[${new Date().toLocaleDateString()}] ${data.remarks}`
        : `[${new Date().toLocaleDateString()}] ${data.remarks}`;
    }
    
    await existing.save();
    return existing.populate('staffId', 'fullName role currentSalary');
  }
  
  // Create new payment if none exists
  const payment = new MonthlyPayment(data);
  await payment.save();
  return payment.populate('staffId', 'fullName role currentSalary');
}

  async getStaffPayments(staffId: string, year?: number) {
    try {
      const query: any = { staffId };
      if (year) query.year = year;
      
      const payments = await MonthlyPayment.find(query)
        .sort({ year: -1, month: -1 })
        .populate('staffId', 'fullName role currentSalary');
      return payments;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getAllPayments(filters: { year?: number; month?: string; status?: string }) {
    try {
      const query: any = {};
      if (filters.year) query.year = filters.year;
      if (filters.month) query.month = filters.month;
      if (filters.status) query.status = filters.status;
      
      const payments = await MonthlyPayment.find(query)
        .sort({ year: -1, month: -1 })
        .populate('staffId', 'fullName role currentSalary');
      return payments;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async updateMonthlyPayment(id: string, data: UpdateMonthlyPaymentInput) {
    try {
      const payment = await MonthlyPayment.findByIdAndUpdate(id, data, { new: true })
        .populate('staffId', 'fullName role currentSalary');
      if (!payment) {
        throw new Error('Payment record not found');
      }
      return payment;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async deleteMonthlyPayment(id: string) {
    try {
      const payment = await MonthlyPayment.findByIdAndDelete(id);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      return payment;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Role Management
  getAllRoles() {
    return Array.from(this.roles.values());
  }

  getRoleByName(name: string) {
    return this.roles.get(name);
  }

  addRole(name: string, description?: string) {
    if (this.roles.has(name)) {
      throw new Error('Role already exists');
    }
    const role = { name, description: description || '' };
    this.roles.set(name, role);
    return role;
  }

  updateRole(oldName: string, newName: string, description?: string) {
    if (!this.roles.has(oldName)) {
      throw new Error('Role not found');
    }
    if (oldName !== newName && this.roles.has(newName)) {
      throw new Error('Role name already exists');
    }
    
    const role = { name: newName, description: description || '' };
    this.roles.delete(oldName);
    this.roles.set(newName, role);
    
    // Update all staff with this role
    Staff.updateMany({ role: oldName }, { role: newName }).exec();
    
    return role;
  }

  deleteRole(name: string) {
    const defaultRoles = ['Manager', 'Doctor', 'Worker'];
    if (defaultRoles.includes(name)) {
      throw new Error('Cannot delete default roles');
    }
    
    if (!this.roles.has(name)) {
      throw new Error('Role not found');
    }
    
    // Check if any staff has this role
    return Staff.findOne({ role: name }).then(staff => {
      if (staff) {
        throw new Error(`Cannot delete role "${name}" as it is assigned to staff members`);
      }
      this.roles.delete(name);
      return { message: 'Role deleted successfully' };
    });
  }

  // Summary/Dashboard
  async getStaffSummary() {
    try {
      const totalStaff = await Staff.countDocuments();
      const activeStaff = await Staff.countDocuments({ status: 'Active' });
      const inactiveStaff = await Staff.countDocuments({ status: 'Inactive' });
      
      const roleDistribution = await Staff.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      const totalMonthlySalary = await Staff.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$currentSalary' } } }
      ]);
      
      const pendingPayments = await MonthlyPayment.countDocuments({ status: 'Pending' });
      
      return {
        totalStaff,
        activeStaff,
        inactiveStaff,
        roleDistribution: roleDistribution.map(r => ({ role: r._id, count: r.count })),
        totalMonthlySalary: totalMonthlySalary[0]?.total || 0,
        pendingPayments
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}