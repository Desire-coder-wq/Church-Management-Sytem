import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewayService } from './payment-gateway.service';
import { ConfigService } from '@nestjs/config';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    config = { get: jest.fn().mockReturnValue('mock') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewayService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<PaymentGatewayService>(PaymentGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process mock payment successfully', async () => {
    const result = await service.processPayment(50000, 'CASH', 'TXN-001');
    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });

  it('should return error for unimplemented providers', async () => {
    config.get.mockReturnValue('stripe');
    const result = await service.processPayment(50000, 'CASH', 'TXN-002');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not implemented');
  });

  it('should verify payment', async () => {
    const result = await service.verifyPayment('txn-123');
    expect(result.success).toBe(true);
  });
});