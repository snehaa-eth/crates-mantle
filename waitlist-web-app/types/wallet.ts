export interface WalletInfo {
  address: `0x${string}`;
  type: WalletType;
  chainId: number;
  isConnected: boolean;
  provider?: any;
}

export enum WalletType {
  METAMASK = 'metamask',
  PRIVY_EMBEDDED = 'privy_embedded',
  WALLET_CONNECT = 'wallet_connect',
  COINBASE = 'coinbase',
  UNKNOWN = 'unknown'
}

export interface WalletCapabilities {
  canSignMessage: boolean;
  canSignTypedData: boolean;
  canSendTransaction: boolean;
  canSwitchChain: boolean;
}

export interface WalletError extends Error {
  code: WalletErrorCode;
  walletType?: WalletType;
}

export enum WalletErrorCode {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',
  SIGNATURE_REJECTED = 'SIGNATURE_REJECTED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SignMessageParams {
  message: string;
}

export interface SignTypedDataParams {
  domain: any;
  types: any;
  primaryType: string;
  message: any;
}

export interface SendTransactionParams {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  gas?: bigint;
  gasPrice?: bigint;
}

export interface WalletAdapter {
  type: WalletType;
  isAvailable(): boolean;
  connect(): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  getWalletInfo(): WalletInfo | null;
  signMessage(params: SignMessageParams): Promise<string>;
  signTypedData(params: SignTypedDataParams): Promise<string>;
  sendTransaction(params: SendTransactionParams): Promise<string>;
  switchChain(chainId: number): Promise<void>;
  getCapabilities(): WalletCapabilities;
}

export interface WalletManager {
  getActiveWallet(): WalletAdapter | null;
  getWalletInfo(): WalletInfo | null;
  connect(walletType: WalletType): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  signMessage(params: SignMessageParams): Promise<string>;
  signTypedData(params: SignTypedDataParams): Promise<string>;
  sendTransaction(params: SendTransactionParams): Promise<string>;
  switchChain(chainId: number): Promise<void>;
  isWalletAvailable(walletType: WalletType): boolean;
  getAvailableWallets(): WalletType[];
}