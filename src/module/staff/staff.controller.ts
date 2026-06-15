import { Request, Response } from 'express';
import { StaffService } from './staff.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

const staffService = new StaffService();

export class StaffController {
  // Staff CRUD
  createStaff = asyncHandler(async (req: Request, res: Response) => {
    const staff = await staffService.createStaff(req.body);
    res.status(201).json(ApiResponse.success('Staff created successfully', staff));
  });

  getAllStaff = asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search } = req.query;
    const staff = await staffService.getAllStaff({ 
      role: role as string, 
      status: status as any, 
      search: search as string 
    });
    res.json(ApiResponse.success('Staff retrieved successfully', staff));
  });

  getStaffById = asyncHandler(async (req: Request, res: Response) => {
    const staff = await staffService.getStaffById(req.params.id);
    res.json(ApiResponse.success('Staff retrieved successfully', staff));
  });

  updateStaff = asyncHandler(async (req: Request, res: Response) => {
    const staff = await staffService.updateStaff(req.params.id, req.body);
    res.json(ApiResponse.success('Staff updated successfully', staff));
  });

  updateSalary = asyncHandler(async (req: Request, res: Response) => {
    const staff = await staffService.updateSalary(req.params.id, req.body);
    res.json(ApiResponse.success('Salary updated successfully', staff));
  });

  deleteStaff = asyncHandler(async (req: Request, res: Response) => {
    await staffService.deleteStaff(req.params.id);
    res.json(ApiResponse.success('Staff deleted successfully', null));
  });

  // Monthly Payments
 createMonthlyPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await staffService.createMonthlyPayment(req.body);
  res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully' });
});

  getStaffPayments = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.query;
    const payments = await staffService.getStaffPayments(req.params.staffId, year ? parseInt(year as string) : undefined);
    res.json(ApiResponse.success('Payments retrieved successfully', payments));
  });

  getAllPayments = asyncHandler(async (req: Request, res: Response) => {
    const { year, month, status } = req.query;
    const payments = await staffService.getAllPayments({ 
      year: year ? parseInt(year as string) : undefined, 
      month: month as string, 
      status: status as string 
    });
    res.json(ApiResponse.success('Payments retrieved successfully', payments));
  });

  updateMonthlyPayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await staffService.updateMonthlyPayment(req.params.id, req.body);
    res.json(ApiResponse.success('Payment updated successfully', payment));
  });

  deleteMonthlyPayment = asyncHandler(async (req: Request, res: Response) => {
    await staffService.deleteMonthlyPayment(req.params.id);
    res.json(ApiResponse.success('Payment deleted successfully', null));
  });

  // Role Management
  getAllRoles = asyncHandler(async (req: Request, res: Response) => {
    const roles = staffService.getAllRoles();
    res.json(ApiResponse.success('Roles retrieved successfully', roles));
  });

  addRole = asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const role = staffService.addRole(name, description);
    res.status(201).json(ApiResponse.success('Role added successfully', role));
  });

  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const { oldName, newName, description } = req.body;
    const role = staffService.updateRole(oldName, newName, description);
    res.json(ApiResponse.success('Role updated successfully', role));
  });

  deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const result = staffService.deleteRole(req.params.name);
    res.json(ApiResponse.success('Role deleted successfully', result));
  });

  // Summary
  getStaffSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await staffService.getStaffSummary();
    res.json(ApiResponse.success('Summary retrieved successfully', summary));
  });
}