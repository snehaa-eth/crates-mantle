export interface Stock {
    stockId: string;
    symbol: string;
    name: string;
    weight: number;
    price: number;
  }
  export interface RegisterUserInput {
    wallet: string;
    name?: string;
    email?: string;
  }
  export interface StockHolding {
    stockId: string;
    price: number;
    userHoldingUSD: number;
    sharesOwned: number;
    netGain: number;
  }
  
  export interface Crate {
    crateId: string;
    name: string;
    description: string;
    imageUrl: string;
    subscriptionAmount: number;
    subscriptionPeriod: string;
    rebalanceFrequency: string;
    riskPercent: number;
    totalReturnPercent: number;
    monthlyReturnPercent: number;
    activeSubscribers: number;
    createProgramAddressSync: string;
    stocks: Stock[];
    userInvestment: {
      investedAmount: number;
      currentValue: number;
      totalReturnPercent: number;
      monthlyReturnPercent: number;
      stockHoldings: StockHolding[];
    };
  }
  
  export interface EnrichedUser {
    _id?: string; 
    wallet: string;
    email?: string;
    name?: string;
    phoneNumber?: string;
    dinari_account_id?: string;
    is_dinari_wallet_link?: boolean;
    entity_id?: string;
    nationality?: string | null;
    is_kyc_complete?: boolean;
    subscribedCrates?: Crate[]; 
    transactions?: string[]; 
    totalInvested?: number;
    totalInvestedCrates?: number;
    totalUniqueStocks?: number;
    totalReturnPercent?: number;
    currentValidateAccounts?: string[];
  }