import dotenv from 'dotenv';
import { parseSolanaPrivateKey } from '../lib/utils';
import { Connection } from '@solana/web3.js';
dotenv.config();
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/solana_lst',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  jupiterApiUrl: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
  sanctumApiUrl: process.env.SANCTUM_API_URL || 'https://sanctum-s-api.fly.dev/v1',
  sanctumExtraApiUrl: process.env.SANCTUM_EXTRA_API_URL || 'https://extra-api.sanctum.so/v1',
  minApyImprovementThreshold: parseFloat(process.env.MIN_APY_IMPROVEMENT_THRESHOLD || '2.0'),
  maxFeeToYieldRatio: parseFloat(process.env.MAX_FEE_TO_YIELD_RATIO || '0.1'),
  stopLossThreshold: parseFloat(process.env.STOP_LOSS_THRESHOLD || '60.0'),
  defaultSlippageBps: parseInt(process.env.DEFAULT_SLIPPAGE_BPS || '50', 10),
  solanaWalletPrivateKey: parseSolanaPrivateKey(process.env.SOLANA_WALLET_PRIVATE_KEY),
};

export const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 30000,
  }
);