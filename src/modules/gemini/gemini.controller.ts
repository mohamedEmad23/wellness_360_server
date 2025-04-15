import {Body, Post ,Controller, UsePipes, ValidationPipe} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GetAIMessageDTO } from './model/get-ai-response.dto';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) {}

    @Post('generate')
    @UsePipes(new ValidationPipe({ transform: true }))
    async generateContent(@Body() data: GetAIMessageDTO) {
        return this.geminiService.generateContent(data);
    }
}