import { cookies } from "next/headers";
import { StravaCookie } from "@/app/constants/tokens";

/**
 * Retrieves the Strava access token from cookies
 * @returns The access token if present, null otherwise
 */
export async function getStravaToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(StravaCookie.AccessToken)?.value || null;
}

/**
 * Retrieves the Strava access token and throws an error if not found
 * @param errorMessage Optional custom error message
 * @returns The access token
 * @throws Error if token is missing
 */
export async function getStravaTokenOrThrow(
  errorMessage = "Missing Strava token",
): Promise<string> {
  const token = await getStravaToken();
  if (!token) {
    throw new Error(errorMessage);
  }
  return token;
}
