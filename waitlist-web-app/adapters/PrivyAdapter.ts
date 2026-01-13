import { WalletAdapter, WalletInfo, WalletType, WalletCapabilities, WalletError, WalletErrorCode, SignMessageParams, SignTypedDataParams, SendTransactionParams } from '@/types/wallet';

export class PrivyAdapter implements WalletAdapter {
  public readonly type = WalletType.PRIVY_EMBEDDED;
  private walletInfo: WalletInfo | null = null;
  private privyHooks: any;
  private user: any;

  constructor(privyHooks: any, user: any) {
    this.privyHooks = privyHooks;
    this.user = user;
  }

  public isAvailable(): boolean {
    return !!this.user;
  }

  public async connect(): Promise<WalletInfo> {
    if (!this.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_FOUND, 'Privy user not available');
    }

    console.log(this.user);

    const privyWallet = this.user?.linkedAccounts?.find(
      (account: any) => account.type === "wallet" && 
      account.walletClientType === "privy" && 
      account.chainType === "ethereum"
    );

    if (!privyWallet) {
      throw this.createError(WalletErrorCode.WALLET_NOT_FOUND, 'Privy embedded wallet not found');
    }

    this.walletInfo = {
      address: privyWallet.address as `0x${string}`,
      type: WalletType.PRIVY_EMBEDDED,
      chainId: 11155111, // Reflect Sepolia as active chain for embedded wallet
      isConnected: true,
    };

    return this.walletInfo;
  }

  public async disconnect(): Promise<void> {
    // Privy handles disconnection through its own logout
    this.walletInfo = null;
  }

  public getWalletInfo(): WalletInfo | null {
    if (!this.user) return null;

    const privyWallet = this.user?.linkedAccounts?.find(
      (account: any) => account.type === "wallet" && 
      account.walletClientType === "privy" && 
      account.chainType === "ethereum"
    );

    if (!privyWallet) return null;

    return {
      address: privyWallet.address as `0x${string}`,
      type: WalletType.PRIVY_EMBEDDED,
      chainId: 11155111,
      isConnected: true,
    };
  }

  public async signMessage(params: SignMessageParams): Promise<string> {
    if (!this.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'Privy user not available');
    }

    try {
      const result = await this.privyHooks.signMessage({ message: params.message });
      return typeof result === 'string' ? result : result.signature;
    } catch (error: any) {
      if (error.message?.includes('rejected')) {
        throw this.createError(WalletErrorCode.SIGNATURE_REJECTED, 'User rejected signature');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async signTypedData(params: SignTypedDataParams): Promise<string> {
    if (!this.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'Privy user not available');
    }

    try {
      const result = await this.privyHooks.signTypedData(params);
      return typeof result === 'string' ? result : result.signature;
    } catch (error: any) {
      if (error.message?.includes('rejected')) {
        throw this.createError(WalletErrorCode.SIGNATURE_REJECTED, 'User rejected signature');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async sendTransaction(params: SendTransactionParams): Promise<string> {
    if (!this.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'Privy user not available');
    }

    try {
      const result = await this.privyHooks.sendTransaction(params);
      return typeof result === 'string' ? result : result.hash;
    } catch (error: any) {
      if (error.message?.includes('rejected')) {
        throw this.createError(WalletErrorCode.TRANSACTION_REJECTED, 'User rejected transaction');
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    // Privy handles chain switching internally through its own mechanisms
    throw this.createError(WalletErrorCode.CHAIN_NOT_SUPPORTED, 'Chain switching not supported for Privy embedded wallet');
  }

  public getCapabilities(): WalletCapabilities {
    return {
      canSignMessage: true,
      canSignTypedData: true,
      canSendTransaction: true,
      canSwitchChain: false, // Privy handles this internally
    };
  }

  private createError(code: WalletErrorCode, message: string): WalletError {
    const error = new Error(message) as WalletError;
    error.code = code;
    error.walletType = this.type;
    return error;
  }
}