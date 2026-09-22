import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn() } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should create a new user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'ADMIN',
        churchId: 'church-1',
        church: { name: 'Test Church' },
        passwordHash: '',
      });

      const result = await service.signup('Test User', 'Test Church', 'test@example.com', 'Password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).toHaveBeenCalled();
      const createdData = prisma.user.create.mock.calls[0][0];
      expect(createdData.data.email).toBe('test@example.com');
      expect(createdData.data.role).toBe('ADMIN');
      expect(await bcrypt.compare('Password123', createdData.data.passwordHash)).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      await expect(service.signup('Test User', 'Test Church', 'test@example.com', 'Password123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'ADMIN',
        churchId: 'church-1',
        isActive: true,
        church: { name: 'Test Church' },
        passwordHash: hashedPassword,
      });

      const result = await service.login('test@example.com', 'Password123');

      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
      });

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('notfound@example.com', 'Password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: false,
        passwordHash: hashedPassword,
      });

      await expect(service.login('test@example.com', 'Password123')).rejects.toThrow(UnauthorizedException);
    });
  });
});