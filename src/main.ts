import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
      .setTitle('Wellness 360 API')
      .setDescription('The Wellness 360 API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT ?? 3000);
    console.log(`App running on port ${process.env.PORT ?? 3000}`);
    console.log('Swagger documentation available at /api');
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  }
}

void bootstrap();
