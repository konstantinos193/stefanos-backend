import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @ApiPropertyOptional({ example: 'Thank you for your feedback!' })
  @IsOptional()
  @IsString()
  response?: string; // Host response
}

