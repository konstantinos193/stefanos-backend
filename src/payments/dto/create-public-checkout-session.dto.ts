import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}
