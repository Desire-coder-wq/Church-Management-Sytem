import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; churchId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user?.isActive ||
      !user.churchId ||
      user.churchId !== payload.churchId
    ) {
      throw new UnauthorizedException(
        "Your session is no longer valid. Please sign in again.",
      );
    }
    return {
      sub: user.id,
      churchId: user.churchId,
      role: user.role,
      email: user.email,
    };
  }
}
