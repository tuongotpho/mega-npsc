
// Helper Functions for Date manipulation

// Convert DD/MM/YYYY to YYYY-MM-DD (for HTML input date)
export const toYMD = (dmy: string): string => {
    if (!dmy || typeof dmy !== 'string') return '';
    const parts = dmy.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Convert YYYY-MM-DD to DD/MM/YYYY (for display/storage)
export const toDMY = (ymd: string): string => {
    if (!ymd || typeof ymd !== 'string') return '';
    const parts = ymd.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

// Parse DD/MM/YYYY string to Date object
export const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    // Note: month is 0-indexed in JS Date
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? null : date;
};

// Calculate difference in days between two dates
export const diffDays = (start: Date, end: Date): number => {
    const difference = end.getTime() - start.getTime();
    return Math.round(difference / (1000 * 60 * 60 * 24));
};
