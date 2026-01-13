import { useWalletClient, useAccount, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, WalletClient } from "viem";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletManagerService } from "@/services/WalletManager";
import { WalletType, WalletInfo, WalletError } from "@/types/wallet";
import { sepolia } from "viem/chains"; // or whichever default you target

export function useUniversalWalletClient() {
  const { data: wagmiWalletClient } = useWalletClient();
  const { address: wagmiAddress, isConnected: isWagmiConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { user } = usePrivy();
  const { wallets } = useWallets();

  const [walletManager] = useState(() => WalletManagerService.getInstance());
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<WalletError | null>(null);

  const wagmiHooks = useMemo(
    () => ({
      address: wagmiAddress,
      isConnected: isWagmiConnected,
      chainId,
      walletClient: wagmiWalletClient,
      publicClient,
    }),
    [wagmiAddress, isWagmiConnected, chainId, wagmiWalletClient, publicClient]
  );

  const privyHooks = useMemo(() => ({ user }), [user]);

  useEffect(() => {
    walletManager.initialize(wagmiHooks, privyHooks, user);
    walletManager.refresh();

    const info = walletManager.getWalletInfo();
    setWalletInfo(info);
    setError(null);
  }, [walletManager, wagmiHooks, privyHooks, user]);

  const getWalletClient = useCallback(async (): Promise<WalletClient> => {
    try {
      setError(null);

      const activeWallet = walletManager.getActiveWallet();
      if (!activeWallet) throw new Error("No active wallet found");

      const info = walletManager.getWalletInfo();
      if (!info) throw new Error("No wallet info available");

      console.log("Wallet Info:", info);

      // -----------------------
      // 🦊 MetaMask
      // -----------------------
      if (info.type === WalletType.METAMASK) {
        // Use wagmi if available
        if (wagmiWalletClient) return wagmiWalletClient;

        if (typeof window !== "undefined" && (window as any).ethereum) {
          const metamaskProvider = (window as any).ethereum;

          // Switch chain if needed
          const targetChainId = publicClient?.chain?.id || sepolia.id;
          const currentChainId = await metamaskProvider.request({ method: "eth_chainId" });
          if (parseInt(currentChainId, 16) !== targetChainId) {
            try {
              await metamaskProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
              });
            } catch (err) {
              console.warn("Chain switch failed:", err);
            }
          }

          return createWalletClient({
            account: info.address,
            chain: publicClient?.chain || sepolia,
            transport: custom(metamaskProvider),
          });
        }

        throw new Error("MetaMask wallet client not available");
      }

      // -----------------------
      // 🔐 Privy Embedded Wallet
      // -----------------------
      if (info.type === WalletType.PRIVY_EMBEDDED) {
        const embedded = wallets.find(
          (w: any) =>
            w.walletClientType === "privy" && (w as any).connectorType === "embedded"
        ) as any;

        const privyWallet =
          embedded || (wallets.find((w: any) => w.walletClientType === "privy") as any);

        if (!privyWallet) throw new Error("Privy wallet not found");

        // 🧩 Switch chain if needed
        const targetChainId = publicClient?.chain?.id || sepolia.id;
        const currentChainId = await privyWallet.getChainId?.();
        if (currentChainId !== targetChainId) {
          await privyWallet.switchChain(targetChainId);
        }

        // Create viem client
        const provider = await privyWallet.getEthereumProvider?.();
        if (!provider) throw new Error("Failed to get Privy wallet provider");

        return createWalletClient({
          account: info.address,
          chain: publicClient?.chain || sepolia,
          transport: custom(provider),
        });
      }

      // -----------------------
      // ❌ Fallback
      // -----------------------
      throw new Error(`Unsupported wallet type: ${info.type}`);
    } catch (err) {
      console.error("getWalletClient error:", err);
      const walletError = new Error(
        err instanceof Error ? err.message : "Unknown error"
      ) as WalletError;
      walletError.code = "UNKNOWN_ERROR" as any;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager, wagmiWalletClient, publicClient, user, wallets]);

  return {
    getWalletClient,
    address: walletInfo?.address || null,
    walletType: walletInfo?.type || null,
    chainId: walletInfo?.chainId || null,
    isConnected: walletInfo?.isConnected || false,
    isPrivyWallet: walletInfo?.type === WalletType.PRIVY_EMBEDDED,
    isExternalWallet: walletInfo?.type === WalletType.METAMASK,
    error,
    clearError: () => setError(null),
    refresh: () => {
      walletManager.refresh();
      const info = walletManager.getWalletInfo();
      setWalletInfo(info);
    },
  };
}
