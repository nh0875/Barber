import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative flex flex-col min-w-0 min-h-0 bg-zinc-950 overflow-auto">
        {children}
      </main>
    </div>
  );
}