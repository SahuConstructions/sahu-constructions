import { IsDateString, IsString } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;
}
