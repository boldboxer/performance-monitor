"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  // 👇 Create a single persistent client for the app
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
