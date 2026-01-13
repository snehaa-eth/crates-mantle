"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import {  mainnet, sepolia } from 'viem/chains';
import { http } from 'wagmi';
import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode, StrictMode, useState } from "react";

export const config = createConfig({
  chains: [sepolia],  // add any common chains
  transports: {
    [sepolia.id]: http()
  },
});
export default function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <StrictMode>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          appearance: {
            theme: "dark",
            walletChainType: "ethereum-only",
            showWalletLoginFirst: false,
          },
          loginMethods: ["google", "passkey", "twitter", "email"],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </StrictMode>
  );
}
