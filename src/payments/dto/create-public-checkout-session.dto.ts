import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectedRoomDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  pricePerNight: number;
}

export class CreatePublicCheckoutSessionDto {
  @IsString()
  propertyId: string;

  @IsString()
  roomId: string;

  @IsString()
  @IsOptional()
  roomName?: string;

  @IsString()
  checkIn: string;

  @IsString()
  checkOut: string;

  @IsNumber()
  @Min(1)
  guests: number;

  @IsString()
  guestName: string;

  @IsEmail()
  guestEmail: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adults?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  infants?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedRoomDto)
  selectedRooms?: SelectedRoomDto[];

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}
