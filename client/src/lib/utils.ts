import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 * using clsx and tailwind-merge for proper handling of Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a localized date format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return 'Data inválida';
  }
}

/**
 * Gets the color styling for ticket types
 */
export function getTicketTypeStyles(type: string) {
  switch (type) {
    case "Bug":
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        icon: "fas fa-bug"
      };
    case "Sugestão":
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "fas fa-lightbulb"
      };
    case "Feedback":
      return {
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
        icon: "fas fa-comment"
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: "fas fa-question"
      };
  }
}

/**
 * Gets the color styling for ticket statuses
 */
export function getTicketStatusStyles(status: string) {
  switch (status) {
    case "Novo":
      return "bg-blue-100 text-blue-800";
    case "Em andamento":
      return "bg-yellow-100 text-yellow-800";
    case "Resolvido":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Truncates a string to a specific length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Validates a file size (in bytes) against a maximum size (in MB)
 */
export function validateFileSize(fileSize: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Validates a file type against allowed file types
 */
export function validateFileType(fileType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(fileType);
}
