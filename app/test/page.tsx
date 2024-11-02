// app/test-paypal/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TestResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function TestPayPal() {
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const testAuthToken = async () => {
    try {
      setLoading("auth");
      const res = await fetch("/api/test/paypal/test-auth");
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, error: "Failed to get auth token" });
    } finally {
      setLoading(null);
    }
  };

  const testSubscription = async () => {
    try {
      setLoading("subscription");
      const res = await fetch("/api/paypal/test-subscription");
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, error: "Failed to get subscription details" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>PayPal Service Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAuthToken} disabled={loading === "auth"}>
              {loading === "auth" ? "Testing..." : "Test Auth Token"}
            </Button>

            <Button onClick={testSubscription} disabled={loading === "subscription"}>
              {loading === "subscription" ? "Testing..." : "Test Subscription"}
            </Button>
          </div>

          {response && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Response:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
