import { validate } from 'class-validator';
import { MemberDto } from './member.dto';

describe('MemberDto validation', () => {
  it('should pass for valid member data', async () => {
    const dto = new MemberDto();
    dto.fullName = 'John Doe';
    dto.phone = '+256700000000';
    dto.group = 'Youth Group';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when fullName is too short', async () => {
    const dto = new MemberDto();
    dto.fullName = 'J';
    dto.phone = '+256700000000';
    dto.group = 'Youth Group';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fullName');
  });

  it('should fail when phone is invalid', async () => {
    const dto = new MemberDto();
    dto.fullName = 'John Doe';
    dto.phone = '12345';
    dto.group = 'Youth Group';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
  });

  it('should fail when group is empty', async () => {
    const dto = new MemberDto();
    dto.fullName = 'John Doe';
    dto.phone = '+256700000000';
    dto.group = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('group');
  });
});