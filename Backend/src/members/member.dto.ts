import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class MemberDto {
  @ApiProperty() @IsString() @MinLength(2, { message: 'Full name must contain at least 2 characters.' }) @MaxLength(120)
  fullName!: string;
  @ApiProperty() @IsPhoneNumber('UG', { message: 'Enter a valid phone number including +256.' })
  phone!: string;
  @ApiProperty() @IsString() @MinLength(2, { message: 'Enter a group name.' }) @MaxLength(80)
  group!: string;
}
