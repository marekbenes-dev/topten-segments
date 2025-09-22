"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const RedirectPage = () => {
  const { replace } = useRouter();
  const searchParams = useSearchParams();

  const signin = useCallback(async () => {
    const code = searchParams.get("code");

    if (!code) {
      return;
    }

    const response = await fetch("/redirect", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return;
    }

    replace("/dashboard");
  }, [replace, searchParams]);

  useEffect(() => {
    signin();
  }, [signin]);

  return (
    <Suspense fallback={<p>Loading…</p>}>
       <div className="container mx-auto pt-10">
        <div className="bg-slate-800 rounded-lg px-6 py-8 text-white">
          <div className="w-11/12 m-auto">
            <p className="font-title text-shamrock text-center text-2xl">
              Signing in, you&apos;ll be redirected...
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default RedirectPage;