import { WalletAdapter, WalletInfo, WalletType, WalletCapabilities, WalletError, WalletErrorCode, SignMessageParams, SignTypedDataParams, SendTransactionParams } from '@/types/wallet';

export class MetaMaskAdapter implements WalletAdapter {
  public readonly type = WalletType.METAMASK;
  private walletInfo: WalletInfo | null = null;
  private wagmiHooks: any;

  constructor(wagmiHooks: any) {
    this.wagmiHooks = wagmiHooks;
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  public async connect(): Promise<WalletInfo> {
    if (!this.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_FOUND, 'MetaMask not available');
    }

    if (!this.wagmiHooks.isConnected || !this.wagmiHooks.address) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'MetaMask not connected');
    }

    this.walletInfo = {
      address: this.wagmiHooks.address as `0x${string}`,
      type: WalletType.METAMASK,
      chainId: this.wagmiHooks.chainId || 1,
      isConnected: true,
    };

    return this.walletInfo;
  }

  public async disconnect(): Promise<void> {
    // MetaMask doesn't support programmatic disconnection
    this.walletInfo = null;
  }

  public getWalletInfo(): WalletInfo | null {
    if (!this.wagmiHooks.isConnected || !this.wagmiHooks.address) {
      return null;
    }

    return {
      address: this.wagmiHooks.address as `0x${string}`,
      type: WalletType.METAMASK,
      chainId: this.wagmiHooks.chainId || 1,
      isConnected: true,
    };
  }

  public async signMessage(params: SignMessageParams): Promise<string> {
    if (!this.wagmiHooks.isConnected) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'MetaMask not connected');
    }

    try {
      return await this.wagmiHooks.signMessageAsync({ message: params.message });
    } catch (error: any) {
      if (error.code === 4001) {
        throw this.createError(WalletErrorCode.SIGNATURE_REJECTED, 'User rejected signature');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async signTypedData(params: SignTypedDataParams): Promise<string> {
    if (!this.wagmiHooks.isConnected) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'MetaMask not connected');
    }

    try {
      return await this.wagmiHooks.signTypedDataAsync(params);
    } catch (error: any) {
      if (error.code === 4001) {
        throw this.createError(WalletErrorCode.SIGNATURE_REJECTED, 'User rejected signature');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async sendTransaction(params: SendTransactionParams): Promise<string> {
    if (!this.wagmiHooks.isConnected) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'MetaMask not connected');
    }

    try {
      return await this.wagmiHooks.sendTransactionAsync(params);
    } catch (error: any) {
      if (error.code === 4001) {
        throw this.createError(WalletErrorCode.TRANSACTION_REJECTED, 'User rejected transaction');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    if (!this.wagmiHooks.isConnected) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'MetaMask not connected');
    }

    try {
      await this.wagmiHooks.switchChain({ chainId });
    } catch (error: any) {
      if (error.code === 4001) {
        throw this.createError(WalletErrorCode.SIGNATURE_REJECTED, 'User rejected chain switch');
      }
      throw this.createError(WalletErrorCode.CHAIN_NOT_SUPPORTED, error.message);
    }
  }

  public getCapabilities(): WalletCapabilities {
    return {
      canSignMessage: true,
      canSignTypedData: true,
      canSendTransaction: true,
      canSwitchChain: true,
    };
  }

  private createError(code: WalletErrorCode, message: string): WalletError {
    const error = new Error(message) as WalletError;
    error.code = code;
    error.walletType = this.type;
    return error;
  }
}