import SidebarNav from "./SidebarNav";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col md:flex-row">
      <aside className="w-full md:w-50 shrink-0 md:border-r p-4 sm:border-b">
        <SidebarNav />
      </aside>
      <section className="flex-1 p-6">{children}</section>
    </div>
  );
}
