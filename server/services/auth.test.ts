import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}));

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash passwords correctly', async () => {
    const password = 'testPassword123';
    const hashedPassword = 'hashedValue';
    
    vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword);
    
    const result = await bcrypt.hash(password, 10);
    
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    expect(result).toBe(hashedPassword);
  });

  it('should compare passwords correctly', async () => {
    const password = 'testPassword123';
    const hashedPassword = 'hashedValue';
    
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    
    const result = await bcrypt.compare(password, hashedPassword);
    
    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    expect(result).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const password = 'wrongPassword';
    const hashedPassword = 'hashedValue';
    
    vi.mocked(bcrypt.compare).mockResolvedValue(false);
    
    const result = await bcrypt.compare(password, hashedPassword);
    
    expect(result).toBe(false);
  });
});