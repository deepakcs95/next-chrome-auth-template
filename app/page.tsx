import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Token from "./(auth)/auth/_components/token";
import { Toaster } from "@/components/ui/toaster";
export default function page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div>
        <SignedOut>
          <SignInButton mode="modal" />
          {/* reset the extension token */}
          <Token action="logout" />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">Select the perfect plan for your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"></div>
      </div>
      {/* <ExtensionSync /> */}
      <Toaster />
    </main>
  );
}
