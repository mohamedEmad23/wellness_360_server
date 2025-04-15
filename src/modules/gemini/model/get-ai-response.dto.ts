import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetAIMessageDTO {
  @IsString()
  @IsNotEmpty()
  prompt: string; // The prompt to send to the AI model

  @IsOptional()
  @IsString()
  sessionId?: string;
}
