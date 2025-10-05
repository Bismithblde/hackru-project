/**
 * Validate if a string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate points value
 */
export function isValidPoints(points: number): boolean {
  return Number.isInteger(points) && points >= 1 && points <= 10;
}

/**
 * Validate username
 */
export function isValidUsername(username: string): boolean {
  return username.trim().length >= 2 && username.trim().length <= 50;
}
