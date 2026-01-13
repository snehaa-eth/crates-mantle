import { AddressLookupTableAccount } from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";
import { connection } from "../../config";

export async function deserializeTransaction(swapTransaction, maxRetries = 3) {
  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const tx = VersionedTransaction.deserialize(swapTransactionBuf);
  const addressLookupTableAccounts = await Promise.all(
    tx.message.addressTableLookups.map(async (lookup) => {
      let retryCount = 0;
      let lastError;

      while (retryCount <= maxRetries) {
        try {
          const accountInfo = await connection.getAccountInfo(
            lookup.accountKey
          );
          if (!accountInfo || !accountInfo.data) {
            throw new Error(
              `Account Info Not Found For ${lookup.accountKey.toString()}`
            );
          }

          return new AddressLookupTableAccount({
            key: lookup.accountKey,
            state: AddressLookupTableAccount.deserialize(accountInfo.data),
          });
        } catch (error) {
          lastError = error;
          retryCount++;

          if (retryCount <= maxRetries) {
            const delay = Math.min(
              1000 * Math.pow(2, retryCount) * (0.9 + Math.random() * 0.2),
              10000
            );
            console.log(
              `Retry ${retryCount}/${maxRetries} for Account Lookup Table: ${lookup.accountKey.toString()}, Waiting ${Math.round(
                delay
              )}ms,`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    })
  );

  return { tx, addressLookupTableAccounts };
}
