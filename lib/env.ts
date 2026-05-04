function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function validateEnv() {
  getRequiredEnv("DATABASE_URL");
  getRequiredEnv("NEXTAUTH_SECRET");
}
