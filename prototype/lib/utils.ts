import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges className fragments, letting later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
