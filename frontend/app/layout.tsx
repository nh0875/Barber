import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "../styles/globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CocoRapado OS",
  description: "Sistema operativo para Barbería",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased overflow-hidden flex h-screen relative`}>
        {/* Fondo Global */}
        <div className="fixed inset-0 z-[-1] flex items-center justify-center opacity-[0.03] pointer-events-none w-full h-full object-cover overflow-hidden">
           <Image src="/logo/logo.png" alt="Fondo" width={800} height={800} className="object-cover blur-[1px]" />
        </div>
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
