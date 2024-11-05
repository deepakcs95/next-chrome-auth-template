import { Suspense } from "react";

import React from "react";
import { AuthButton } from "./auth/auth-button";
import { SymbolIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SaaS Platform</h1>
        <nav className="flex items-center gap-4">
          {/* Custom auth component */}
          <Link prefetch href="/dashboard">
            Dashboard
          </Link>
          <Link prefetch href="/plans">
            Plans
          </Link>
          <Suspense
            fallback={
              <div className="w-5 h-5 animate-spin ">
                <SymbolIcon className="w-full h-full" />
              </div>
            }
          >
            <AuthButton />
          </Suspense>
        </nav>
      </div>
    </header>
  );
};
