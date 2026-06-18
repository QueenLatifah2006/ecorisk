import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/src/components/theme-provider';
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
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
