import { WalletManager, WalletAdapter, WalletInfo, WalletType, WalletError, WalletErrorCode, SignMessageParams, SignTypedDataParams, SendTransactionParams } from '@/types/wallet';
import { WalletDetector } from './walletDetector';
import { MetaMaskAdapter } from '@/adapters/MetaMaskAdapter';
import { PrivyAdapter } from '@/adapters/PrivyAdapter';

export class WalletManagerService implements WalletManager {
  private static instance: WalletManagerService;
  private detector: WalletDetector;
  private adapters: Map<WalletType, WalletAdapter> = new Map();
  private activeWallet: WalletAdapter | null = null;
  private wagmiHooks: any = null;
  private privyHooks: any = null;
  private user: any = null;

  private constructor() {
    this.detector = WalletDetector.getInstance();
  }

  public static getInstance(): WalletManagerService {
    if (!WalletManagerService.instance) {
      WalletManagerService.instance = new WalletManagerService();
    }
    return WalletManagerService.instance;
  }

  /**
   * Initialize the wallet manager with required hooks
   */
  public initialize(wagmiHooks: any, privyHooks: any, user: any): void {
    this.wagmiHooks = wagmiHooks;
    this.privyHooks = privyHooks;
    this.user = user;

    // Initialize adapters
    this.adapters.set(WalletType.METAMASK, new MetaMaskAdapter(wagmiHooks));
    this.adapters.set(WalletType.PRIVY_EMBEDDED, new PrivyAdapter(privyHooks, user));

    // Auto-detect and set active wallet
    this.detectAndSetActiveWallet();
  }

  /**
   * Auto-detect the best available wallet and set it as active
   */
  private detectAndSetActiveWallet(): void {
    const availableWallets = this.detector.getAvailableWallets(
      this.user?.linkedAccounts || [],
      this.wagmiHooks?.isConnected || false
    );

    if (availableWallets.length === 0) {
      this.activeWallet = null;
      return;
    }

    // Priority: MetaMask > Privy Embedded
    const primaryWalletType = this.detector.detectPrimaryWallet(
      this.user?.linkedAccounts || [],
      this.wagmiHooks?.isConnected || false,
      this.wagmiHooks?.address
    );
    console.log({primaryWalletType});

    const adapter = this.adapters.get(primaryWalletType);
    if (adapter && adapter.isAvailable()) {
      this.activeWallet = adapter;
    } else {
      // Fallback to first available wallet
      const fallbackType = availableWallets[0];
      this.activeWallet = this.adapters.get(fallbackType) || null;
    }
  }

  public getActiveWallet(): WalletAdapter | null {
    return this.activeWallet;
  }

  public getWalletInfo(): WalletInfo | null {
    if (!this.activeWallet) {
      return null;
    }

    const walletInfo = this.activeWallet.getWalletInfo();
    if (!walletInfo) {
      return null;
    }

    // Validate wallet connection
    const validation = this.detector.validateWalletConnection(
      walletInfo,
      this.user?.linkedAccounts || []
    );

    if (!validation.isValid) {
      console.warn('Wallet validation failed:', validation.errors);
      return null;
    }

    return walletInfo;
  }

  public async connect(walletType: WalletType): Promise<WalletInfo> {
    const adapter = this.adapters.get(walletType);
    if (!adapter) {
      throw this.createError(WalletErrorCode.WALLET_NOT_FOUND, `Wallet adapter not found: ${walletType}`);
    }

    if (!adapter.isAvailable()) {
      throw this.createError(WalletErrorCode.WALLET_NOT_FOUND, `Wallet not available: ${walletType}`);
    }

    try {
      const walletInfo = await adapter.connect();
      this.activeWallet = adapter;
      return walletInfo;
    } catch (error: any) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.activeWallet) {
      await this.activeWallet.disconnect();
      this.activeWallet = null;
    }
  }

  public async signMessage(params: SignMessageParams): Promise<string> {
    if (!this.activeWallet) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'No active wallet');
    }

    const capabilities = this.activeWallet.getCapabilities();
    if (!capabilities.canSignMessage) {
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, 'Wallet does not support message signing');
    }

    try {
      return await this.activeWallet.signMessage(params);
    } catch (error: any) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async signTypedData(params: SignTypedDataParams): Promise<string> {
    if (!this.activeWallet) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'No active wallet');
    }

    const capabilities = this.activeWallet.getCapabilities();
    if (!capabilities.canSignTypedData) {
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, 'Wallet does not support typed data signing');
    }

    try {
      return await this.activeWallet.signTypedData(params);
    } catch (error: any) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async sendTransaction(params: SendTransactionParams): Promise<string> {
    if (!this.activeWallet) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'No active wallet');
    }

    const capabilities = this.activeWallet.getCapabilities();
    if (!capabilities.canSendTransaction) {
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, 'Wallet does not support transactions');
    }

    try {
      return await this.activeWallet.sendTransaction(params);
    } catch (error: any) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    if (!this.activeWallet) {
      throw this.createError(WalletErrorCode.WALLET_NOT_CONNECTED, 'No active wallet');
    }

    const capabilities = this.activeWallet.getCapabilities();
    if (!capabilities.canSwitchChain) {
      throw this.createError(WalletErrorCode.CHAIN_NOT_SUPPORTED, 'Wallet does not support chain switching');
    }

    try {
      await this.activeWallet.switchChain(chainId);
    } catch (error: any) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError(WalletErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  public isWalletAvailable(walletType: WalletType): boolean {
    const adapter = this.adapters.get(walletType);
    return adapter ? adapter.isAvailable() : false;
  }

  public getAvailableWallets(): WalletType[] {
    return this.detector.getAvailableWallets(
      this.user?.linkedAccounts || [],
      this.wagmiHooks?.isConnected || false
    );
  }

  /**
   * Refresh the active wallet detection (useful when connection status changes)
   */
  public refresh(): void {
    this.detectAndSetActiveWallet();
  }

  private createError(code: WalletErrorCode, message: string): WalletError {
    const error = new Error(message) as WalletError;
    error.code = code;
    return error;
  }
}