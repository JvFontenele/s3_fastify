import { hash, compare } from 'bcryptjs';

export async function hashString(input: string): Promise<string> {
  return hash(input, 10);
}

export async function verifyHash(input: string, hashed: string): Promise<boolean> {
  return compare(input, hashed);
}
