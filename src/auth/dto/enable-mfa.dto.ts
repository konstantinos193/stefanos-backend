import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum MFAType {
  TOTP = 'TOTP',
  EMAIL = 'EMAIL',
}

export class EnableMFADto {
  @IsEnum(MFAType)
  type: MFAType;
}

export class VerifyMFADto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  backupCode?: string;
}

