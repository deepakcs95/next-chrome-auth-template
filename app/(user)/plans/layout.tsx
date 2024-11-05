"use client";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
        currency: "USD",
        vault: true,
        intent: "subscription",
        environment: "sandbox",
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </PayPalScriptProvider>
  );
}
