import { ConvexReactClient } from "convex/react";

const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || "";

export const isConvexConfigured = (): boolean => {
  return typeof convexUrl === "string" && convexUrl.trim().length > 0 && convexUrl.startsWith("http");
};

export const convexClient = isConvexConfigured()
  ? new ConvexReactClient(convexUrl)
  : null;
