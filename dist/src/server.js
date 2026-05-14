"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLocalServer = void 0;
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const seed_admin_1 = require("./utils/seed-admin");
const PORT = process.env.PORT || 5000;
// Simplified connection for local development
const startLocalServer = async () => {
    try {
        // Connect to database
        await (0, db_1.connectDatabase)();
        console.log('✅ MongoDB connected');
        // Seed admin user
        await (0, seed_admin_1.seedAdminUser)();
        console.log('✅ Admin user seeded');
        // Start server
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
exports.startLocalServer = startLocalServer;
// Only run if this file is executed directly (not imported)
if (require.main === module) {
    startLocalServer();
}
