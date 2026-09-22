import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health (or any endpoint)', () => {
    it('should allow requests under limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
          .expect(401);
      }
    });

    it('should block requests over limit with 429', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' });
      }

      await request(app.getHttpServer())
        .get('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(429);
    });
  });
});