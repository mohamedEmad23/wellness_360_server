import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [GeminiController],
  providers: [GeminiService],
  exports: [GeminiService], // Export GeminiService to be used in other modules
})
export class GeminiModule {}
