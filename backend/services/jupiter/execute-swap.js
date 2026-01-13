const {
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const { connection } = require("../../config/jupiter.config");

const { deserializeTransaction } = require("./deserialize-transaction");
const { getSwapTxn } = require("./get-swap-transaction");
const { signTransaction } = require("./sign-transaction");
const { getSignature } = require("../../lib/utils");

async function waitForTransactionConfirmation(signature, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const status = await connection.getSignatureStatus(signature);
    if (
      status?.value?.confirmationStatus === "confirmed" ||
      status?.value?.confirmationStatus === "finalized"
    ) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/**
 * Executes a swap using either Jito MEV protection or regular Jupiter swap
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param amount Amount to swap
 * @param walletKeypair Wallet keypair for signing
 * @param maxJitoSlotDistance Maximum acceptable distance to Jito leader slot (default 10)
 * @returns Object containing transaction hash and whether MEV protection was used
 */
export async function executeSwapWithMevProtection(
  inputMint,
  outputMint,
  amount,
  walletKeypair
) {
  try {
    // Get the swap transaction from Jupiter
    const { swapObj } = await getSwapTxn(
      inputMint,
      outputMint,
      amount,
      walletKeypair.publicKey.toString()
    );

    // Deserialize and prepare the transaction
    const { tx, addressLookupTableAccounts } = await deserializeTransaction(
      swapObj.swapTransaction
    );

    const message = TransactionMessage.decompile(tx.message, {
      addressLookupTableAccounts,
    });

    const transaction = new VersionedTransaction(
      message.compileToV0Message(addressLookupTableAccounts)
    );

    // Always get latest blockhash before signing
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.message.recentBlockhash = latestBlockhash.blockhash;

    const signedTransaction = await signTransaction(
      transaction,
      walletKeypair,
      0.001 * LAMPORTS_PER_SOL
    );

    const txHash = getSignature(signedTransaction);
    console.log("Transaction signature:", txHash);
    const isConfirmed = await waitForTransactionConfirmation(txHash, 45);
    if (!isConfirmed) {
      throw new Error("Transaction failed to confirm within timeout");
    }

    console.log("Regular swap transaction confirmed:", txHash);
    return { txHash: txHash };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}
