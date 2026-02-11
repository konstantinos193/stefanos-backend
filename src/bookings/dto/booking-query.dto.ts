import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingStatus } from './create-booking.dto';

export class BookingQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by guest name, email, or booking ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BookingStatus, description: 'Filter by booking status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter bookings from this date (ISO string, e.g. 2024-06-01)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter bookings until this date (ISO string, e.g. 2024-06-30)' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
