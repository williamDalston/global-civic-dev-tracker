/**
 * Wraps a database query to safely handle missing DATABASE_URL during build.
 * Returns null if the query fails due to missing connection.
 */
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    return await queryFn();
  } catch {
    return null;
  }
}
