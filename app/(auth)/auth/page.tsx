import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
export default function page() {
  return (
    <div>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
