import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: 'http://localhost:3000', // your frontend origin
      credentials: true, // ❗ allow cookies to be sent
    });
    // Enable cookie parsing
    app.use(cookieParser());

    // Add validation pipe with transformation enabled
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit conversion of primitives
        },
        whitelist: true, // Strip properties not in DTO
      }),
    );

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
