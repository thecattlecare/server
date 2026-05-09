"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilkController = void 0;
const milk_service_1 = require("./milk.service");
const milk_sale_service_1 = require("./milk-sale.service");
const async_handler_1 = require("../../utils/async-handler");
const api_response_1 = require("../../utils/api-response");
class MilkController {
    constructor() {
        this.service = new milk_service_1.MilkService();
        this.saleService = new milk_sale_service_1.MilkSaleService();
        this.createMilkRecord = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const data = {
                ...req.body
            };
            const record = await this.service.createMilkRecord(data);
            return res.status(201).json(api_response_1.ApiResponse.success('Milk record created successfully', record));
        });
        this.getMilkRecords = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const filter = {
                cattleId: req.query.cattleId,
                shift: req.query.shift,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };
            const records = await this.service.getMilkRecords(filter);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk records fetched successfully', records));
        });
        this.getMilkRecordById = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const record = await this.service.getMilkRecordById(req.params.id);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk record fetched successfully', record));
        });
        this.updateMilkRecord = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const record = await this.service.updateMilkRecord(req.params.id, req.body);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk record updated successfully', record));
        });
        this.deleteMilkRecord = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const result = await this.service.deleteMilkRecord(req.params.id);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk record deleted successfully', result));
        });
        this.getTodayStats = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const stats = await this.service.getTodayStats();
            return res.status(200).json(api_response_1.ApiResponse.success('Today\'s stats fetched successfully', stats));
        });
        this.getSummaryStats = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const [productionToday, salesToday, totalProduced, totalSold] = await Promise.all([
                this.service.getTodayStats(),
                this.saleService.getTodayStats(),
                this.service.getTotalAmount(),
                this.saleService.getTotalAmount(),
            ]);
            const currentStock = Math.max(totalProduced - totalSold, 0);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk summary fetched successfully', {
                productionToday,
                salesToday,
                totalProduced,
                totalSold,
                currentStock,
            }));
        });
        this.getDashboardStats = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const stats = await this.service.getDashboardStats();
            return res.status(200).json(api_response_1.ApiResponse.success('Dashboard stats fetched successfully', stats));
        });
        this.getCattleMilkHistory = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const history = await this.service.getCattleMilkHistory(req.params.cattleId, days);
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle milk history fetched successfully', history));
        });
        this.getBulkStats = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json(api_response_1.ApiResponse.error('Start date and end date are required'));
            }
            const records = await this.service.getMilkRecords({
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });
            // Calculate stats
            const totalAmount = records.data.reduce((sum, r) => sum + r.amount, 0);
            const byShift = records.data.reduce((acc, r) => {
                acc[r.shift] = (acc[r.shift] || 0) + r.amount;
                return acc;
            }, {});
            return res.status(200).json(api_response_1.ApiResponse.success('Bulk stats fetched successfully', {
                totalAmount,
                byShift,
                recordCount: records.data.length,
                dateRange: { startDate, endDate }
            }));
        });
        this.getLast14DaysProduction = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const data = await this.service.getLast14DaysProduction();
            return res.status(200).json(api_response_1.ApiResponse.success('Last 14 days production fetched successfully', data));
        });
        this.getLast12WeeksProduction = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const data = await this.service.getLast12WeeksProduction();
            return res.status(200).json(api_response_1.ApiResponse.success('Last 12 weeks production fetched successfully', data));
        });
        this.getLast12MonthsProduction = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const data = await this.service.getLast12MonthsProduction();
            return res.status(200).json(api_response_1.ApiResponse.success('Last 12 months production fetched successfully', data));
        });
    }
}
exports.MilkController = MilkController;
