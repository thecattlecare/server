"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilkSaleController = void 0;
const async_handler_1 = require("../../utils/async-handler");
const api_response_1 = require("../../utils/api-response");
const milk_sale_service_1 = require("./milk-sale.service");
class MilkSaleController {
    constructor() {
        this.service = new milk_sale_service_1.MilkSaleService();
        this.createMilkSale = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const data = {
                ...req.body,
            };
            const record = await this.service.createMilkSale(data);
            return res.status(201).json(api_response_1.ApiResponse.success('Milk sale created successfully', record));
        });
        this.getMilkSales = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const filter = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const records = await this.service.getMilkSales(filter);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk sales fetched successfully', records));
        });
        this.getMilkSaleById = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const record = await this.service.getMilkSaleById(req.params.id);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk sale fetched successfully', record));
        });
        this.updateMilkSale = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const record = await this.service.updateMilkSale(req.params.id, req.body);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk sale updated successfully', record));
        });
        this.deleteMilkSale = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const result = await this.service.deleteMilkSale(req.params.id);
            return res.status(200).json(api_response_1.ApiResponse.success('Milk sale deleted successfully', result));
        });
        this.getTodaySaleStats = (0, async_handler_1.asyncHandler)(async (req, res) => {
            const stats = await this.service.getTodayStats();
            return res.status(200).json(api_response_1.ApiResponse.success('Today\'s milk sales fetched successfully', stats));
        });
    }
}
exports.MilkSaleController = MilkSaleController;
