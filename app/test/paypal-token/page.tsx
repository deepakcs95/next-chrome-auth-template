"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Database, AlertTriangle, Check, X } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface TokenStatus {
  status: "none" | "valid" | "expired";
  icon: LucideIcon;
  color: string;
}

interface MockPayPalService {
  memoryToken: TokenCache | null;
  dbToken: TokenCache | null;
  lastFetch: number | null;
  getTokenFromDB: () => Promise<TokenCache | null>;
  fetchNewToken: () => Promise<TokenCache>;
  getAuthToken: () => Promise<string>;
  isTokenExpired: (expiresAt: number) => boolean;
  expireTokens: () => void;
}

// Mock PayPal service for testing
const mockPayPalService: MockPayPalService = {
  memoryToken: null,
  dbToken: null,
  lastFetch: null,

  async getTokenFromDB() {
    return this.dbToken;
  },

  async fetchNewToken() {
    const token: TokenCache = {
      token: `mock_token_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
    };
    this.memoryToken = token;
    this.dbToken = token;
    this.lastFetch = Date.now();
    return token;
  },

  async getAuthToken() {
    if (this.memoryToken && !this.isTokenExpired(this.memoryToken.expiresAt)) {
      return this.memoryToken.token;
    }

    const dbToken = await this.getTokenFromDB();
    if (dbToken && !this.isTokenExpired(dbToken.expiresAt)) {
      this.memoryToken = dbToken;
      return dbToken.token;
    }

    const newToken = await this.fetchNewToken();
    return newToken.token;
  },

  isTokenExpired(expiresAt: number) {
    return Date.now() >= expiresAt - 5 * 60 * 1000;
  },

  expireTokens() {
    if (this.memoryToken) {
      this.memoryToken = {
        ...this.memoryToken,
        expiresAt: Date.now() - 60 * 1000, // Expired 1 minute ago
      };
    }
    if (this.dbToken) {
      this.dbToken = {
        ...this.dbToken,
        expiresAt: Date.now() - 60 * 1000, // Expired 1 minute ago
      };
    }
  },
};

const TokenTester: React.FC = () => {
  const [memoryToken, setMemoryToken] = useState<TokenCache | null>(null);
  const [dbToken, setDbToken] = useState<TokenCache | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = () => {
    setMemoryToken(mockPayPalService.memoryToken);
    setDbToken(mockPayPalService.dbToken);
    setLastFetch(mockPayPalService.lastFetch);
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "None";
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatToken = (token: TokenCache | null): string => {
    if (!token) return "None";
    return `${token.token.substring(0, 15)}...`;
  };

  const getTokenStatus = (token: TokenCache | null): TokenStatus => {
    if (!token) return { status: "none", icon: X, color: "text-gray-400" };
    if (mockPayPalService.isTokenExpired(token.expiresAt)) {
      return { status: "expired", icon: AlertTriangle, color: "text-yellow-500" };
    }
    return { status: "valid", icon: Check, color: "text-green-500" };
  };

  const handleGetToken = async () => {
    try {
      setLoading(true);
      setError(null);
      await mockPayPalService.getAuthToken();
      refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMemory = () => {
    mockPayPalService.memoryToken = null;
    refreshState();
  };

  const handleClearDB = () => {
    mockPayPalService.dbToken = null;
    refreshState();
  };

  const handleExpireTokens = () => {
    mockPayPalService.expireTokens();
    refreshState();
  };

  useEffect(() => {
    refreshState();
  }, []);

  const renderStatusIcon = (token: TokenCache | null) => {
    const { icon: Icon, color } = getTokenStatus(token);
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>{/* ... header content remains the same ... */}</CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span className="font-medium">Memory Cache:</span>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusIcon(memoryToken)}
              <span>{formatToken(memoryToken)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span className="font-medium">DB Cache:</span>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusIcon(dbToken)}
              <span>{formatToken(dbToken)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-medium">Last Fetch:</span>
            <span>{formatTime(lastFetch)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGetToken} disabled={loading}>
            Get Token
          </Button>
          <Button variant="outline" onClick={handleClearMemory}>
            Clear Memory
          </Button>
          <Button variant="outline" onClick={handleClearDB}>
            Clear DB
          </Button>
          <Button variant="outline" onClick={handleExpireTokens}>
            Expire Tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default TokenTester;
