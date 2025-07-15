import { describe, it, expect } from 'vitest';
import { normalizeExamResults } from './exam-normalizer';

describe('normalizeExamResults', () => {
  it('should normalize blood test results correctly', () => {
    const input = 'Hemoglobina: 14.5 g/dL\nGlicose: 95 mg/dL\nColesterol Total: 180 mg/dL';
    const result = normalizeExamResults(input);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      category: 'Blood Test',
      name: 'Hemoglobina',
      value: 14.5,
      unit: 'g/dL',
      normalRange: { min: 12, max: 16 },
      status: 'normal'
    });
    expect(result[1].name).toBe('Glicose');
    expect(result[2].name).toBe('Colesterol total');
  });

  it('should handle values outside normal range', () => {
    const input = 'Glicose: 200 mg/dL';
    const result = normalizeExamResults(input);
    
    expect(result[0].status).toBe('high');
  });

  it('should parse different formats correctly', () => {
    const input = 'TSH = 3.5 mIU/L\nT4 Livre - 1.2 ng/dL';
    const result = normalizeExamResults(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Tsh');
    expect(result[0].value).toBe(3.5);
    expect(result[1].name).toBe('T4 livre');
    expect(result[1].value).toBe(1.2);
  });

  it('should handle empty input', () => {
    const result = normalizeExamResults('');
    expect(result).toEqual([]);
  });

  it('should skip invalid lines', () => {
    const input = 'Valid: 10 mg/dL\nInvalid line without value\nAnother: 20 units';
    const result = normalizeExamResults(input);
    
    expect(result).toHaveLength(2);
  });
});