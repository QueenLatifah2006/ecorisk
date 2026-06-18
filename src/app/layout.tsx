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
    <html lang="fr">
      <body>
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
