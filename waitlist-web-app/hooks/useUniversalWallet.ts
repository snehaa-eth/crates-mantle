import { useAccount, useSignMessage, useSignTypedData, useSendTransaction, useSwitchChain } from "wagmi";
import { useSignMessage as usePrivySignMessage, useSignTypedData as usePrivySignTypedData, useSendTransaction as usePrivySendTransaction, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletManagerService } from "@/services/WalletManager";
import { WalletType, WalletInfo, WalletError } from "@/types/wallet";

export function useUniversalWallet() {
  // Wagmi hooks for MetaMask/external wallets
  const { address: wagmiAddress, isConnected: isWagmiConnected, chainId } = useAccount();
  const { signMessageAsync: wagmiSignMessage } = useSignMessage();
  const { signTypedDataAsync: wagmiSignTypedData } = useSignTypedData();
  const { sendTransactionAsync: wagmiSendTransaction } = useSendTransaction();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();

  // Privy hooks for embedded wallets
  const { signMessage: privySignMessage } = usePrivySignMessage();
  const { signTypedData: privySignTypedData } = usePrivySignTypedData();
  const { sendTransaction: privySendTransaction } = usePrivySendTransaction();
  const { user } = usePrivy();

  // Wallet manager state
  const [walletManager] = useState(() => WalletManagerService.getInstance());
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<WalletError | null>(null);

  // Prepare hooks for wallet manager
  const wagmiHooks = useMemo(() => ({
    address: wagmiAddress,
    isConnected: isWagmiConnected,
    chainId,
    signMessageAsync: wagmiSignMessage,
    signTypedDataAsync: wagmiSignTypedData,
    sendTransactionAsync: wagmiSendTransaction,
    switchChain: wagmiSwitchChain,
  }), [wagmiAddress, isWagmiConnected, chainId, wagmiSignMessage, wagmiSignTypedData, wagmiSendTransaction, wagmiSwitchChain]);

  const privyHooks = useMemo(() => ({
    signMessage: privySignMessage,
    signTypedData: privySignTypedData,
    sendTransaction: privySendTransaction,
  }), [privySignMessage, privySignTypedData, privySendTransaction]);

  // Initialize wallet manager
  useEffect(() => {
    walletManager.initialize(wagmiHooks, privyHooks, user);
    walletManager.refresh();
    
    const info = walletManager.getWalletInfo();
    setWalletInfo(info);
    setError(null);
  }, [walletManager, wagmiHooks, privyHooks, user]);

  // Universal signMessage function
  const signMessage = useCallback(async ({ message }: { message: string }) => {
    try {
      setError(null);
      const signature = await walletManager.signMessage({ message });
      return signature;
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Universal signTypedData function
  const signTypedData = useCallback(async (params: any) => {
    try {
      setError(null);
      const signature = await walletManager.signTypedData(params);
      return signature;
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Universal sendTransaction function
  const sendTransaction = useCallback(async (params: any) => {
    try {
      setError(null);
      const txHash = await walletManager.sendTransaction(params);
      return txHash;
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Switch chain function
  const switchChain = useCallback(async (chainId: number) => {
    try {
      setError(null);
      await walletManager.switchChain(chainId);
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Connect to specific wallet
  const connectWallet = useCallback(async (walletType: WalletType) => {
    try {
      setError(null);
      const info = await walletManager.connect(walletType);
      setWalletInfo(info);
      return info;
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setError(null);
      await walletManager.disconnect();
      setWalletInfo(null);
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
      throw walletError;
    }
  }, [walletManager]);

  // Get available wallets
  const availableWallets = useMemo(() => {
    return walletManager.getAvailableWallets();
  }, [walletManager, user, isWagmiConnected]);

  // Check if specific wallet is available
  const isWalletAvailable = useCallback((walletType: WalletType) => {
    return walletManager.isWalletAvailable(walletType);
  }, [walletManager]);

  return {
    // Core wallet info
    address: walletInfo?.address || null,
    walletType: walletInfo?.type || null,
    chainId: walletInfo?.chainId || null,
    isConnected: walletInfo?.isConnected || false,
    
    // Wallet type checks
    isPrivyWallet: walletInfo?.type === WalletType.PRIVY_EMBEDDED,
    isExternalWallet: walletInfo?.type === WalletType.METAMASK,
    
    // Core functions
    signMessage,
    signTypedData,
    sendTransaction,
    switchChain,
    
    // Wallet management
    connectWallet,
    disconnectWallet,
    availableWallets,
    isWalletAvailable,
    
    // Error handling
    error,
    clearError: () => setError(null),
    
    // Utility functions
    refresh: () => {
      walletManager.refresh();
      const info = walletManager.getWalletInfo();
      setWalletInfo(info);
    },
  };
}