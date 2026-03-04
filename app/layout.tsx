import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chiquinho Sorvetes - Gestão de Conteúdo",
  description: "Sistema de gerenciamento de conteúdo para Instagram",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden bg-[#020617]"> {/* Dark theme background */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
