
import { describe, it, expect } from 'vitest';
import { toYMD, toDMY, parseDate, diffDays } from '../dateUtils';

describe('Date Utilities', () => {
    describe('toYMD', () => {
        it('converts DD/MM/YYYY to YYYY-MM-DD correctly', () => {
            expect(toYMD('25/12/2023')).toBe('2023-12-25');
            expect(toYMD('01/01/2024')).toBe('2024-01-01');
        });

        it('returns empty string for invalid input', () => {
            expect(toYMD('')).toBe('');
            expect(toYMD('invalid')).toBe('');
            expect(toYMD('2023-12-25')).toBe(''); // Already YMD format is invalid for this function expectation
        });
    });

    describe('toDMY', () => {
        it('converts YYYY-MM-DD to DD/MM/YYYY correctly', () => {
            expect(toDMY('2023-12-25')).toBe('25/12/2023');
            expect(toDMY('2024-01-01')).toBe('01/01/2024');
        });

        it('returns empty string for invalid input', () => {
            expect(toDMY('')).toBe('');
            expect(toDMY('invalid')).toBe('');
        });
    });

    describe('parseDate', () => {
        it('parses DD/MM/YYYY string to Date object correctly', () => {
            const date = parseDate('25/12/2023');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getUTCFullYear()).toBe(2023);
            expect(date?.getUTCMonth()).toBe(11); // Month is 0-indexed
            expect(date?.getUTCDate()).toBe(25);
        });

        it('returns null for invalid date strings', () => {
            expect(parseDate('')).toBeNull();
            expect(parseDate('2023-12-25')).toBeNull(); // Wrong format
            expect(parseDate('32/01/2023')).toBeNull(); // Invalid day? Actually JS Date might rollover, but regex checks format
            expect(parseDate('invalid')).toBeNull();
        });
    });

    describe('diffDays', () => {
        it('calculates difference between two dates correctly', () => {
            const start = new Date(Date.UTC(2023, 0, 1));
            const end = new Date(Date.UTC(2023, 0, 5));
            expect(diffDays(start, end)).toBe(4);
        });

        it('returns negative value if end date is before start date', () => {
            const start = new Date(Date.UTC(2023, 0, 5));
            const end = new Date(Date.UTC(2023, 0, 1));
            expect(diffDays(start, end)).toBe(-4);
        });
    });
});
