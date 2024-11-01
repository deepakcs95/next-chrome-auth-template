"use client";
import { useAuth } from "@clerk/clerk-react";
import React, { useEffect } from "react";

export const WEBAPP_ORIGIN = (process.env.NEXT_PUBLIC_WEBAPP_URL as string) || "*";

type Props = {
  token?: string;
  action: "login" | "logout";
  name?: string;
  email?: string;
};

interface AuthMessage {
  type: "AUTH_SUCCESS" | "AUTH_LOGOUT";
  token?: string;
  user?: User;
}

type User = {
  name: string;
  email: string;
};

const Token = ({ token = "", action = "logout", email, name = "user" }: Props) => {
  const { signOut } = useAuth();

  console.log("token called", action);

  useEffect(() => {
    if (action === "login" && token.length > 1 && email) {
      const message: AuthMessage = {
        type: "AUTH_SUCCESS",
        token: token,
        user: { name, email },
      };
      window.postMessage(message, WEBAPP_ORIGIN);
    }

    if (action === "logout") {
      const message: AuthMessage = {
        type: "AUTH_LOGOUT",
      };
      window.postMessage(message, WEBAPP_ORIGIN);
      signOut();
    }
  }, [token, action]);

  return null;
};
export default Token;
