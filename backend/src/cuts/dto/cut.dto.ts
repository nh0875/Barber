// src/cuts/dto/cut.dto.ts
import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsUUID()
  clientId: string;

  @IsString()
  serviceId: string;

  @IsString()
  barberId: string;
}

export class PayCutDto {
  @IsString()
  method: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
