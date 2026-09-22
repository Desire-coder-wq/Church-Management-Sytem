import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Enter a valid email address.' }) @MaxLength(254)
  email!: string;
  @ApiProperty({ format: 'password' }) @IsString() @MinLength(1, { message: 'Enter your password.' }) @MaxLength(72)
  password!: string;
}
export class SignupDto extends LoginDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  fullName!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  churchName!: string;
  @ApiProperty({ format: 'password', minLength: 8 })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/, { message: 'Password must contain 8–72 characters, uppercase and lowercase letters, and a number.' })
  declare password: string;
}
