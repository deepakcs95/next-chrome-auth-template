import { ThemeProvider } from "@/components/provider/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "../Header";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <ThemeProvider>
        <main className="min-h-screen flex flex-col items-center   dark:bg-gray-900">
          {children}
        </main>
      </ThemeProvider>
    </ClerkProvider>
  );
}
