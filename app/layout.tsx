import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chiquinho Sorvetes - Gestão de Conteúdo",
  description: "Sistema de gerenciamento de conteúdo para Instagram",
};

import NavWrapper from "@/components/NavWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NavWrapper>{children}</NavWrapper>
      </body>
    </html>
  );
}
