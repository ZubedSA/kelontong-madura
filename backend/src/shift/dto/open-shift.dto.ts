import { IsOptional, IsString, IsUUID } from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  @IsOptional()
  warungId?: string;
}
