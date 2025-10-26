import { IsIn, IsOptional, IsString } from 'class-validator';

export class ActionLeaveDto {
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  comments?: string;
}
