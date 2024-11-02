// lib/paypal-service.ts
import { cache } from "react";
import prisma from "./db";
import { headers } from "next/headers";

interface PayPalAuthResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

export type webhook = {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: object;
};

class PayPalService {
  private static instance: PayPalService;
  private memoryTokenCache: TokenCache | null = null;
  private clientId: string;
  private clientSecret: string;
  private isProduction: boolean;

  private constructor() {
    this.clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    this.isProduction = process.env.NODE_ENV === "production";

    if (!this.clientId || !this.clientSecret) {
      throw new Error("PayPal credentials not configured");
    }
  }

  public static getInstance(): PayPalService {
    if (!PayPalService.instance) {
      PayPalService.instance = new PayPalService();
    }
    return PayPalService.instance;
  }

  private get baseUrl(): string {
    return this.isProduction ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  }

  private isTokenExpired(expiresAt: number): boolean {
    // Add 5 minute buffer before expiration
    return Date.now() >= expiresAt - 5 * 60 * 1000;
  }

  public async getTokenFromDB(): Promise<TokenCache | null> {
    try {
      const tokenRecord = await prisma.paypalToken.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (!tokenRecord) return null;

      return {
        token: tokenRecord.accessToken,
        expiresAt: tokenRecord.expiresAt.getTime(),
      };
    } catch (error) {
      console.error("Failed to get token from DB:", error);
      return null;
    }
  }

  private async saveTokenToDB(token: string, expiresIn: number): Promise<void> {
    try {
      await prisma.paypalToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() }, // delete tokens with expiration date before now
        },
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await prisma.paypalToken.create({
        data: {
          accessToken: token,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Failed to save token to DB:", error);
    }
  }

  private async fetchNewToken(): Promise<TokenCache> {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
          "base64"
        )}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal auth failed: ${response.statusText}`);
    }

    const data: PayPalAuthResponse = await response.json();
    const tokenCache: TokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    // Save to memory
    this.memoryTokenCache = tokenCache;

    // Save to DB
    await this.saveTokenToDB(data.access_token, data.expires_in);

    return tokenCache;
  }

  public async getAuthToken(): Promise<string> {
    try {
      // Check memory cache first
      if (this.memoryTokenCache && !this.isTokenExpired(this.memoryTokenCache.expiresAt)) {
        return this.memoryTokenCache.token;
      }

      // Check DB cache
      const dbToken = await this.getTokenFromDB();
      if (dbToken && !this.isTokenExpired(dbToken.expiresAt)) {
        this.memoryTokenCache = dbToken; // Cache in memory for future use
        return dbToken.token;
      }

      // Get new token if neither cache is valid
      const newTokenCache = await this.fetchNewToken();
      return newTokenCache.token;
    } catch (error) {
      console.error("PayPal authentication error:", error);
      throw error;
    }
  }

  private extractWebhookFields(headers: Headers) {
    const requiredFields = {
      authAlgo: headers.get("paypal-auth-algo"),
      certUrl: headers.get("paypal-cert-url"),
      transmissionId: headers.get("paypal-transmission-id"),
      transmissionSig: headers.get("paypal-transmission-sig"),
      transmissionTime: headers.get("paypal-transmission-time"),
    };

    console.log("Extracted Headers:", JSON.stringify(requiredFields, null, 2));

    // Check for missing required fields
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(`Missing required PayPal webhook fields: ${missingFields.join(", ")}`);
    }

    return {
      auth_algo: requiredFields.authAlgo,
      cert_url: requiredFields.certUrl,
      transmission_id: requiredFields.transmissionId,
      transmission_sig: requiredFields.transmissionSig,
      transmission_time: requiredFields.transmissionTime,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID || "7WE898061J468734V",
    };
  }

  public async verifyWebhookSignature(headers: any, payload: any): Promise<boolean> {
    try {
      const extractedHeaders = this.extractWebhookFields(headers);
      const token = await this.getAuthToken();

      const verificationPayload = {
        auth_algo: extractedHeaders.auth_algo,
        cert_url: "cert_url",
        transmission_id: extractedHeaders.transmission_id,
        transmission_sig: extractedHeaders.transmission_sig,
        transmission_time: extractedHeaders.transmission_time,
        webhook_id: extractedHeaders.webhook_id,
        webhook_event: payload, // Add the actual webhook event payload
      };

      console.log("Verification Payload:", JSON.stringify(verificationPayload, null, 2));

      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationPayload), // Send the correctly formatted payload
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Webhook verification failed:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("Verification Response:", JSON.stringify(data, null, 2));

      return data.verification_status === "SUCCESS";
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false; // Changed to return false instead of throwing
    }
  }

  public async makeRequest<T>(endpoint: string, method: string = "GET", body?: object): Promise<T> {
    try {
      const token = await this.getAuthToken();

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      return response.json();
    } catch (error) {
      console.error("PayPal API request failed:", error);
      throw error;
    }
  }
}

export const getPayPalService = cache(() => {
  return PayPalService.getInstance();
});

// Helper functions remain the same
export async function getSubscriptionDetails(subscriptionId: string) {
  const paypal = await getPayPalService();
  return paypal.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`);
}

// ... other helper functions
