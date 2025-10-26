import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateTimesheetDto {
  @IsString()
  project: string;

  @IsString()
  task: string;

  @IsNumber()
  hours: number;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  status?: string;
}
