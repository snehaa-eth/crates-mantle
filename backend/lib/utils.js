const bs58 = require("bs58");
const { connection } = require("../config/jupiter.config");

export const generateQueryParams = (symbols, paramName = "lst") => {
  if (!symbols.length) {
    throw new Error("No Symbols Provided");
  }

  return symbols
    .map((symbol) => `${paramName}=${encodeURIComponent(symbol)}`)
    .join("&");
};

export const formatTimeRemaining = (timeRemainingSeconds) => {
  const days = Math.floor(timeRemainingSeconds / (24 * 60 * 60));
  const hours = Math.floor((timeRemainingSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeRemainingSeconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "less than 1m";
};

/**
 * Calculates the estimated time remaining in the current epoch
 * @param epochInfo The current epoch information
 * @returns The estimated time remaining in seconds
 */
export const calculateTimeRemainingInEpoch = (epochInfo) => {
  const slotsRemaining = epochInfo.slotsInEpoch - epochInfo.slotIndex;
  const averageSlotTimeMs = 400;
  return (slotsRemaining * averageSlotTimeMs) / 1000;
};

/**
 * Calculates the progress of the current epoch as a percentage
 * @param epochInfo The current epoch information
 * @returns The progress as a percentage string
 */
export const calculateEpochProgress = (epochInfo) => {
  const progress = (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100;
  return progress.toFixed(2);
};

export const parseSolanaPrivateKey = (key) => {
  try {
    if (!key) return null;
    const parsedKey = JSON.parse(key);
    if (!Array.isArray(parsedKey))
      throw new Error("Invalid private key format");
    return new Uint8Array(parsedKey);
  } catch (error) {
    console.error(
      "Invalid SOLANA_WALLET_PRIVATE_KEY format. Expected a JSON array."
    );
    process.exit(1);
  }
};

export default function encodeBase64Bytes(bytes) {
  return btoa(
    bytes.reduce((acc, current) => acc + String.fromCharCode(current), "")
  );
}

export function getSignature(transaction) {
  const signature =
    "signature" in transaction
      ? transaction.signature
      : transaction.signatures[0];
  if (!signature) {
    throw new Error(
      "Missing transaction signature, the transaction was not signed by the fee payer"
    );
  }
  return bs58.encode(signature);
}

/**
 * Checks if a transaction has been confirmed on the Solana blockchain
 * @param signature The transaction signature to check
 * @param maxRetries Maximum number of retries for checking confirmation status
 * @returns Promise<boolean> True if confirmed, false otherwise
 */
export async function checkIfTransactionConfirmed(signature, maxRetries = 3) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await connection.getSignatureStatus(signature);

      if (!response || !response.value) {
        throw new Error("Failed to get transaction status");
      }

      const confirmation = response.value;

      if (
        confirmation?.confirmationStatus === "confirmed" ||
        confirmation?.confirmationStatus === "finalized"
      ) {
        return true;
      }

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      retryCount++;
    } catch (error) {
      if (retryCount >= maxRetries) {
        console.error("Failed to check transaction status:", error);
        return false;
      }
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return false;
}
