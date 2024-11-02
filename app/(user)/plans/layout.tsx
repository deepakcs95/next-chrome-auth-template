"use client";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        currency: "USD",
        vault: true,
        intent: "subscription",
        environment: "sandbox",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
