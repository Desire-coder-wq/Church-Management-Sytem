import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('secret') } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should return user session when valid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      churchId: 'church-1',
      role: 'ADMIN',
      isActive: true,
    });

    const result = await strategy.validate({ sub: 'user-1', churchId: 'church-1' });
    expect(result.sub).toBe('user-1');
    expect(result.churchId).toBe('church-1');
    expect(result.role).toBe('ADMIN');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'user-1', churchId: 'church-1' })).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is inactive', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      churchId: 'church-1',
      role: 'ADMIN',
      isActive: false,
    });

    await expect(strategy.validate({ sub: 'user-1', churchId: 'church-1' })).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when churchId does not match', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      churchId: 'church-1',
      role: 'ADMIN',
      isActive: true,
    });

    await expect(strategy.validate({ sub: 'user-1', churchId: 'different-church' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});