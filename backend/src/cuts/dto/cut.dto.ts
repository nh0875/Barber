// src/cuts/dto/cut.dto.ts
import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsUUID()
  clientId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  barberId?: string;
}

export class UpdateCutDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  barberId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}

export class PayCutDto {
  @IsString()
  method: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
