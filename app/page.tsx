import Link from "next/link";

export default function Home() {
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&%20response_type=force&scope=activity:read`;

  return (
    <div>
       <Link href={stravaAuthUrl}>
          <button>Sign in with Strava</button>
        </Link>
    </div>
  );
}
