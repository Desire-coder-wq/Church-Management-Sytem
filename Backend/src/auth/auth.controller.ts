import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto } from "./auth.dto";
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post("signup") signup(@Body() dto: SignupDto) {
    return this.auth.signup(
      dto.fullName,
      dto.churchName,
      dto.email,
      dto.password,
    );
  }
  @Post("login") login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
