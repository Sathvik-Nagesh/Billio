import React from "react";
import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { convexClient, isConvexConfigured } from "./client";

interface ConvexProviderProps {
  children: React.ReactNode;
}

export const ConvexProvider: React.FC<ConvexProviderProps> = ({ children }) => {
  if (isConvexConfigured() && convexClient) {
    return <BaseConvexProvider client={convexClient}>{children}</BaseConvexProvider>;
  }

  return <>{children}</>;
};
