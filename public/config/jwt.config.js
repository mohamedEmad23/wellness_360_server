"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtConfig = void 0;
const JwtConfig = (configService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: { expiresIn: '1h' },
});
exports.JwtConfig = JwtConfig;
//# sourceMappingURL=jwt.config.js.map