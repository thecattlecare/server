"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const seed_admin_1 = require("./utils/seed-admin");
const PORT = process.env.PORT || 5000;
const retryDatabaseConnection = () => {
    setTimeout(async () => {
        try {
            await (0, db_1.connectDatabase)();
            console.log('✅ MongoDB reconnected');
            await (0, seed_admin_1.seedAdminUser)();
        }
        catch {
            console.log('⏳ Retrying MongoDB connection in 10 seconds...');
            retryDatabaseConnection();
        }
    }, 10000);
};
const start = async () => {
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    try {
        await (0, db_1.connectDatabase)();
        await (0, seed_admin_1.seedAdminUser)(); // Create default admin if needed
    }
    catch {
        console.log('⚠️  Server started without database connection.');
        console.log('⏳ Retrying MongoDB connection in 10 seconds...');
        retryDatabaseConnection();
    }
};
start();
