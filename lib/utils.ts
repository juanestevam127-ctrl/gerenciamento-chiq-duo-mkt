import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function parseLocalDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return new Date(year, month - 1, day);
    } catch {
        return null;
    }
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    if (typeof date === 'string' && date.includes('-') && !date.includes('T')) {
        const localDate = parseLocalDate(date);
        return localDate ? localDate.toLocaleDateString('pt-BR') : '-';
    }

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('pt-BR');
    } catch {
        return '-';
    }
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('pt-BR');
    } catch {
        return '-';
    }
}
