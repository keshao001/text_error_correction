// Document preview constants
export const MAX_LINES_PER_PAGE = 25; // Increased to better fit PDF content
export const MAX_CHARACTERS_PER_LINE = 120;

// Pagination settings
export const PAGINATION = {
  LINES_PER_PAGE: MAX_LINES_PER_PAGE,
  PAGE_SIZE: 50,
  RANGE: 5, // Number of page buttons to show
} as const;