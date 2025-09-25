import Link from "next/link";

export default function Home() {
  const stravaAuthUrl =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${process.env.REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=activity:read`;

  return (
    <div>
      <Link href={stravaAuthUrl}>
        <button
          className="text-left border rounded p-4 hover:bg-gray-50"
          style={{ minWidth: 260, maxWidth: 340 }}
        >
          <div className="mb-2 text-xl font-bold">Sign in with Strava</div>
        </button>
      </Link>
    </div>
  );
}
