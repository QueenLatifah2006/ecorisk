import type { Metadata } from "next";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoRisk AI",
  description: "Predict. Prevent. Protect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-[#f8fafc] text-slate-900 transition-colors duration-300">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
