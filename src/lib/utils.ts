import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatVietnameseNumber(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const str = value.toString().replace('.', ',');
  const [integer, decimal] = str.split(',');
  const formattedInt = formatThousands(integer);
  return decimal !== undefined ? `${formattedInt},${decimal}` : formattedInt;
}

export function parseVietnameseNumber(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}
