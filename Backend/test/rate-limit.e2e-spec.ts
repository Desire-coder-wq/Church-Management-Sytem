import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigModule as ConfigModuleNamespace } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Rate Limiting (e2e)', () => {
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
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate limiting on /api/auth/login', () => {
    it('should allow requests under limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
          .expect(401);
      }
    });

    it('should block requests over limit with 429', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
      }

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(429);
    });
  });
});
