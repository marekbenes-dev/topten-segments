export async function fetchStravaApi(
  endpoint: string,
  token: string,
  params: Record<string, string> = {},
) {
  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava API error: ${res.status} ${text}`);
  }

  return res.json();
}
