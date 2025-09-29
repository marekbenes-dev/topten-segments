"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ExploreLinkCard from "./ExploreLinkCard";

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
      <NavItem href="/activities" label="My Activities" />
      <NavItem href="/segments" label="My Starred Segments" />
      <ExploreLinkCard />
    </nav>
  );
}
