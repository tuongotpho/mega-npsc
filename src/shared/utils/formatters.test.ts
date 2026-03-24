
import { describe, it, expect } from 'vitest';
import { formatBytes, formatCurrency } from '../formatters';

describe('Formatter Utilities', () => {
    describe('formatBytes', () => {
        it('formats 0 bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
        });

        it('formats KB correctly', () => {
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1536)).toBe('1.5 KB');
        });

        it('formats MB correctly', () => {
            expect(formatBytes(1048576)).toBe('1 MB');
        });

        it('respects decimals parameter', () => {
            expect(formatBytes(1536, 0)).toBe('2 KB');
            expect(formatBytes(1536, 3)).toBe('1.500 KB');
        });
    });

    describe('formatCurrency', () => {
        it('formats VND currency correctly', () => {
            // Note: Output might depend on locale environment, but we check specific non-breaking space behavior or symbol
            const result = formatCurrency(1000000);
            expect(result).toContain('₫');
            // Remove non-breaking spaces and regular spaces for value check
            const value = result.replace(/\s/g, '').replace(/ /g, '').replace('₫', '').replace('.', '');
            expect(value).toBe('1000000');
        });
    });
});
