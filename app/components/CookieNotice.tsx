"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CONSENT_COOKIE = "cookie_consent_v1";

export default function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const has = document.cookie
      .split("; ")
      .some((x) => x.startsWith(CONSENT_COOKIE + "="));
    if (!has) setOpen(true);
  }, []);

  if (!open) return null;

  function acknowledge() {
    // 180 days, SameSite=Lax is fine for a first-party banner cookie
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
      JSON.stringify({ necessary: true, ts: Date.now() }),
    )}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`;
    setOpen(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <Card className="mx-auto max-w-3xl p-3 sm:p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-muted-foreground">
            We use essential cookies to keep you signed in and run core
            features. No analytics or ads.
          </p>
          <div className="sm:ml-auto">
            <Button onClick={acknowledge}>Got it</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
