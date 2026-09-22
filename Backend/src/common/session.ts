import { UnauthorizedException } from '@nestjs/common';

export interface Session {
  sub: string;
  churchId: string;
  role: 'ADMIN' | 'STAFF';
}

export function requireChurch(session: Session): string {
  if (!session?.churchId) {
    throw new UnauthorizedException('Sign in again to select your church workspace.');
  }
  return session.churchId;
}
