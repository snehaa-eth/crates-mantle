import { sepolia } from 'viem/chains';
import { useUniversalWallet } from '@/hooks/useUniversalWallet';

/**
 * Ensures the wallet is connected to the correct chain (Sepolia) before executing transactions.
 * For external wallets (MetaMask), it will automatically switch chains.
 * For embedded wallets (Privy), it shows a message to switch manually.
 * 
 * @param useUniversalWallet - The universal wallet hook instance
 * @returns Promise<boolean> - true if chain is correct or switch was successful, false otherwise
 */
export async function ensureCorrectChain(
  switchChain: (chainId: number) => Promise<void>,
  isExternalWallet: boolean,
  currentChainId?: number | null
): Promise<boolean> {
  const targetChainId = sepolia.id;
  
  // If already on correct chain, no action needed
  if (currentChainId === targetChainId) {
    return true;
  }

  // For external wallets (MetaMask), automatically switch chain
  if (isExternalWallet) {
    try {
      await switchChain(targetChainId);
      return true;
    } catch (error) {
      console.error('Failed to switch chain:', error);
      return false;
    }
  }

  // For embedded wallets (Privy), we can't automatically switch
  // Return false to indicate manual intervention is needed
  return false;
}

/**
 * Hook version of ensureCorrectChain for use in React components
 */
export function useEnsureCorrectChain() {
  const { switchChain, isExternalWallet, chainId } = useUniversalWallet();
  
  return async (): Promise<boolean> => {
    return ensureCorrectChain(switchChain, isExternalWallet, chainId);
  };
}