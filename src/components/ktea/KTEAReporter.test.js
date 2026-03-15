import { calculateGEGrowth } from './KTEAReporter';

describe('calculateGEGrowth', () => {
  it('calculates positive growth correctly', () => {
    expect(calculateGEGrowth('4.2', '5.5')).toBe('+1.3');
  });

  it('calculates negative growth correctly', () => {
    expect(calculateGEGrowth('5.5', '4.2')).toBe('-1.3');
  });

  it('calculates zero growth correctly', () => {
    expect(calculateGEGrowth('6.1', '6.1')).toBe('0.0');
  });

  it('strips greater than (>) and less than (<) symbols', () => {
    expect(calculateGEGrowth('>12.9', '14.2')).toBe('+1.3');
    expect(calculateGEGrowth('2.1', '<4.0')).toBe('+1.9');
  });

  it('handles strings with mixed text properly', () => {
    // If "<K.0" is passed, stripping non-numeric/dots leaves ".0" which parseFloat reads as 0
    expect(calculateGEGrowth('<K.0', '1.5')).toBe('+1.5');
  });

  it('returns N/A when inputs are missing or invalid', () => {
    expect(calculateGEGrowth(null, '5.5')).toBe('N/A');
    expect(calculateGEGrowth('5.5', undefined)).toBe('N/A');
    expect(calculateGEGrowth('abc', 'def')).toBe('N/A');
    expect(calculateGEGrowth('', '')).toBe('N/A');
  });

  it('handles raw numeric inputs seamlessly', () => {
    expect(calculateGEGrowth(3, 4.5)).toBe('+1.5');
  });
});