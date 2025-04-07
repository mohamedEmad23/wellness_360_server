"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Wellness 360 API')
            .setDescription('The Wellness 360 API documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, document);
        await app.listen(process.env.PORT ?? 3000);
        console.log(`App running on port ${process.env.PORT ?? 3000}`);
        console.log('Swagger documentation available at /api');
    }
    catch (error) {
        console.error('Bootstrap failed:', error);
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map