import { ConfigService } from '@nestjs/config';
export declare const JwtConfig: (configService: ConfigService) => {
    secret: string;
    signOptions: {
        expiresIn: string;
    };
};
