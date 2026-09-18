import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOTEL POS — Fast Hotel & Restaurant Point of Sale",
  description: "Production-ready Hotel & Restaurant POS web application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900">
        <LanguageProvider>
          <Navbar user={user} />
          <main className="flex-1 flex flex-col">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
