import { ReactNode } from 'react';
import Sidebar from '../../components/Sidebar';

export default function DataLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-950 text-white w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 w-full overflow-auto bg-zinc-950">
           {children}
      </main>
    </div>
  );
}