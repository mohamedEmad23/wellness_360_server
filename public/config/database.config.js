"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const dotenv = require("dotenv");
dotenv.config();
exports.DatabaseConfig = {
    uri: process.env.MONGO_URI,
    options: {
        dbName: 'wellness360',
    },
};
//# sourceMappingURL=database.config.js.map