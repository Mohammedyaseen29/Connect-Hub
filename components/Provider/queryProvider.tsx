"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

function AccountQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
    const { userId } = useAuth();
    // Remount both cache and query observers when the authenticated account changes.
    return <AccountQueryProvider key={userId || "signed-out"}>{children}</AccountQueryProvider>;
};
