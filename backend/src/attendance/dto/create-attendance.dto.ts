import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateAttendanceDto {
  @IsIn(['IN', 'OUT'])
  type: 'IN' | 'OUT';

  @IsString()
  timestamp: string; // ISO string

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  selfieUrl?: string; // S3 URL or placeholder

  @IsOptional()
  @IsString()
  location?: string;   // ✅ properly decorated so it’s not dropped
}
