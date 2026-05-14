"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/config/db");
const seed_admin_1 = require("../src/utils/seed-admin");
// Global promise for database connection (prevents multiple connections)
let dbConnectionPromise = null;
const ensureDatabaseConnection = async () => {
    if (!dbConnectionPromise) {
        dbConnectionPromise = (async () => {
            try {
                await (0, db_1.connectDatabase)();
                await (0, seed_admin_1.seedAdminUser)();
                console.log('✅ Database connected successfully');
            }
            catch (error) {
                console.error('❌ Database connection failed:', error);
                dbConnectionPromise = null;
                throw error;
            }
        })();
    }
    return dbConnectionPromise;
};
// Serverless handler for Vercel
async function handler(req, res) {
    try {
        // Connect to database for each request (connection pooling handles this efficiently)
        await ensureDatabaseConnection();
        // Pass request to Express app
        await new Promise((resolve, reject) => {
            (0, app_1.default)(req, res, (err) => {
                if (err)
                    reject(err);
                resolve(undefined);
            });
        });
    }
    catch (error) {
        console.error('Handler error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
