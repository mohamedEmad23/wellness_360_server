"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModels = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
exports.DatabaseModels = mongoose_1.MongooseModule.forFeature([
    { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
]);
//# sourceMappingURL=database.models.js.map