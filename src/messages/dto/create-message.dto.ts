import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @IsUUID()
  bookingId: string;

  @IsUUID()
  senderId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;
}
