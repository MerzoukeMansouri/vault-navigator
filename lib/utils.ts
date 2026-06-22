import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toConfigName(name: string): string {
  return name.trim().replace(/[\s\-./]+/g, "_").toUpperCase();
}
