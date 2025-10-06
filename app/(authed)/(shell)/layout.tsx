import SidebarNav from "./SidebarNav";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <aside className="w-50 shrink-0 border-r p-4">
        <SidebarNav />
      </aside>
      <section className="flex-1 p-6">{children}</section>
    </div>
  );
}
