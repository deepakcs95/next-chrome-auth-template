import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Token from "./_components/token";
export default function page() {
  return (
    <div>
      <SignedOut>
        <SignInButton />
        {/* reset the extension token */}
        <Token action="logout" />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
