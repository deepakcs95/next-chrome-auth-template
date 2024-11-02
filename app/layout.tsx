import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Platform",
  description: "Modern SaaS platform with subscription management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <ClerkProvider dynamic>
        <body className={inter.className}>{children} </body>
      </ClerkProvider>
    </html>
  );
}
