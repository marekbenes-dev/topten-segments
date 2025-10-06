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
      className={`block rounded px-3 py-2 text-sm ${
        active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
      }`}
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
