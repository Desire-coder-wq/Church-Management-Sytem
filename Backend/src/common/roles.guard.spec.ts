import { RolesGuard, Roles } from './roles.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as any);
  });

  function mockContext(role: string | undefined): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    } as any;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = mockContext('STAFF');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role (ADMIN)', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = mockContext('ADMIN');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role (STAFF)', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'STAFF']);
    const context = mockContext('STAFF');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user has incorrect role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = mockContext('STAFF');
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user in request', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = mockContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should expose Roles decorator', () => {
    const roles = Roles('ADMIN', 'STAFF');
    expect(typeof roles).toBe('function');
  });
});