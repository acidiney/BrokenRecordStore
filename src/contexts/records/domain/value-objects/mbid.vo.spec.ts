import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';
import { BadRequestException } from '@nestjs/common';

describe('MBID', () => {
  const valid = 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d';

  it('creates from valid uuid and lowercases', () => {
    const mbid = MBID.from(valid.toUpperCase());
    expect(mbid.toString()).toBe(valid);
  });

  it('trims input before validation', () => {
    const mbid = MBID.from(`  ${valid}  `);
    expect(mbid.toString()).toBe(valid);
  });

  it('throws BadRequestException on invalid format', () => {
    expect(() => MBID.from('not-a-uuid')).toThrow(BadRequestException);
    expect(() => MBID.from('')).toThrow(BadRequestException);
  });

  it('isValid returns true only for uuid v4 pattern', () => {
    expect(MBID.isValid(valid)).toBe(true);
    expect(MBID.isValid('not-a-uuid')).toBe(false);
    expect(MBID.isValid('')).toBe(false);
  });

  it('equals compares case-insensitively against strings and MBID', () => {
    const a = MBID.from(valid);
    const b = MBID.from(valid.toUpperCase());
    expect(a.equals(b)).toBe(true);
    expect(a.equals(valid.toUpperCase())).toBe(true);
    expect(a.equals('11111111-1111-1111-1111-111111111111')).toBe(false);
  });
});
