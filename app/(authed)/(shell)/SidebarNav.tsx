"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ExploreLinkCard from "./ExploreLinkCard";

const activitiesLink = `activities/${new Date().getFullYear()}`;

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={[
        "block rounded-md px-2 py-2 transition",
        "hover:bg-foreground/10 hover:text-foreground hover:dark:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        active
          ? "bg-foreground/10 text-foreground dark:bg-white/10 font-semibold"
          : "text-slate-800 dark:text-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function SidebarNav() {
  return (
    <nav className="space-y-2">
      <NavItem href={activitiesLink} label="Activities" />
      <NavItem href="/segments" label="Starred Segments" />
      <NavItem href="/refactor-activities" label="Refactor Activities" />
      <ExploreLinkCard />
    </nav>
  );
}
