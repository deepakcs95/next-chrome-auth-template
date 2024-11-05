import { AuthButton } from "@/components/auth/auth-button";
import { SymbolIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Suspense } from "react";
export default function Page() {
  return (
    <>
      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Our SaaS Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Build something amazing with our powerful tools and services
          </p>
          <Link href="/dashboard">
            <button className="px-8 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-300">
              © 2024 SaaS Platform. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
