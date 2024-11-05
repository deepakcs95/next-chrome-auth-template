import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SaaS Platform",
  description: "Your SaaS Platform Description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
