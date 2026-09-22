import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './../src/auth/auth.controller';
import { AuthService } from './../src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e) - with mocked Prisma', () => {
  let app: INestApplication;
  let prismaService: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeAll(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user and return token', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'ADMIN',
        churchId: 'church-1',
        church: { name: 'Test Church' },
        passwordHash: 'hashed-password',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'Test User',
          churchName: 'Test Church',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 409 if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'Test User',
          churchName: 'Test Church',
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const hashedPassword = await import('bcryptjs').then((b) => b.hash('Password123', 12));
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        role: 'ADMIN',
        churchId: 'church-1',
        church: { name: 'Test Church' },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'notfound@example.com', password: 'Password123' })
        .expect(401);
    });
  });

  describe('POST /auth/signup - validation', () => {
    it('should return 400 when password is too weak', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'weak',
          fullName: 'Test User',
          churchName: 'Test Church',
        })
        .expect(400);
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          fullName: 'Test User',
          churchName: 'Test Church',
        })
        .expect(400);
    });
  });
});