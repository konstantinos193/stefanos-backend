import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email or username' })
  @IsString()
  email: string; // Can be email or username

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

