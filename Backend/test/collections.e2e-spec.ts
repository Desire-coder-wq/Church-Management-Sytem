import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as request from 'supertest';
import { CollectionsController } from './../src/collections/collections.controller';
import { CollectionsService } from './../src/collections/collections.service';
import { PledgesService } from './../src/pledges/pledges.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './../src/prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './../src/common/roles.guard';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'user-1', churchId: 'church-1', role: 'ADMIN' };
    return true;
  }
}

class MockRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('CollectionsController (e2e) - with mocked services', () => {
  let app: INestApplication;
  let collectionsService: { list: jest.Mock; create: jest.Mock };
  let testToken: string;

  beforeAll(async () => {
    const jwtService = { sign: jest.fn().mockReturnValue('test-token') };
    const configService = { getOrThrow: jest.fn().mockReturnValue('test-secret') };

    collectionsService = {
      list: jest.fn(),
      create: jest.fn(),
    };

    const pledgesService = {
      list: jest.fn().mockResolvedValue([]),
    };

    const prismaService = {
      member: { findFirst: jest.fn() },
      campaign: { findMany: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        { provide: CollectionsService, useValue: collectionsService },
        { provide: PledgesService, useValue: pledgesService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prismaService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    testToken = jwtService.sign({ sub: 'user-1', churchId: 'church-1', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /collections', () => {
    it('should return list of collections', async () => {
      const mockCollections = [
        { id: 'col-1', amount: 50000, method: 'CASH', paymentDate: '2025-06-15T10:00:00.000Z' },
      ];
      collectionsService.list.mockResolvedValue(mockCollections);

      const response = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toEqual(mockCollections);
      expect(collectionsService.list).toHaveBeenCalled();
    });
  });

  describe('POST /collections', () => {
    it('should create a collection with idempotency key', async () => {
      const mockCollection = { id: 'col-1', amount: 50000, method: 'CASH', paymentDate: '2025-06-15T10:00:00.000Z' };
      collectionsService.create.mockResolvedValue(mockCollection);

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          pledgeId: 'pledge-1',
          amount: 50000,
          paymentDate: '2025-06-15',
          method: 'CASH',
          idempotencyKey: 'unique-key-123',
        })
        .expect(201);

      expect(response.body.id).toBe('col-1');
      expect(collectionsService.create).toHaveBeenCalled();
    });

    it('should reject duplicate idempotency key with 409', async () => {
      collectionsService.create.mockRejectedValue(
        new ConflictException('This request ID belongs to a different collection.'),
      );

      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          pledgeId: 'pledge-1',
          amount: 50000,
          paymentDate: '2025-06-15',
          method: 'CASH',
          idempotencyKey: 'duplicate-key',
        })
        .expect(409);
    });

    it('should return 400 when amount exceeds balance', async () => {
      collectionsService.create.mockRejectedValue(
        new BadRequestException('Payment exceeds the remaining balance.'),
      );

      await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          pledgeId: 'pledge-1',
          amount: 999999,
          paymentDate: '2025-06-15',
          method: 'CASH',
          idempotencyKey: 'overpay-key',
        })
        .expect(400);
    });
  });
});