import { Eip155PrepareProxiedOrderResponse } from '@dinari/api-sdk/resources/v2/accounts/order-requests/stocks/eip155';
import { Eip155PrepareOrderResponse } from '@dinari/api-sdk/resources/v2/accounts/orders/stocks/eip155';
import { createPublicClient, http, WalletClient, PublicClient, TypedData, Address, Account } from 'viem';
import * as allChains from 'viem/chains';
import {MulticallABI,tokenABI} from "@/constants";
import { encodeFunctionData } from 'viem';



export function resolveViemChain(chain_id: string): allChains.Chain {
  // eg. Accepts "eip155:421614" or just "421614"
  const match = chain_id.match(/^eip155:(\d+)$/);
  const numericChainId = match ? Number(match[1]) : Number(chain_id);

  const chain = Object.values(allChains).find((c: allChains.Chain) => c.id === numericChainId);
  if (!chain) {
    throw new Error(`Chain with id ${numericChainId} not found in viem/chains`);
  }
  return chain;
}

export async function sendBatchOrderForViem(
  walletClient: WalletClient,
  chain_id: string,
  orderResponses: Eip155PrepareOrderResponse[],
  account?: Account,
  publicClient?: PublicClient
): Promise<{
  txHash: `0x${string}`;
}> {
  const chain = resolveViemChain(chain_id);

  let resolvedPublicClient = publicClient;
  if (!resolvedPublicClient) {
    resolvedPublicClient = createPublicClient({ transport: http(), chain });
  }

  // Collect all calldatas from all orderResponses
  const calldatas: `0x${string}`[] = [];

  for (const orderResponse of orderResponses) {
    const txDatas = orderResponse.transaction_data;

    if (!Array.isArray(txDatas) || txDatas.length === 0) {
      throw new Error('One of the orderResponses has missing or empty transaction_data');
    }

    for (const tx of txDatas) {
      if (!tx.data) {
        throw new Error('Invalid txData item: missing calldata');
      }
      calldatas.push(tx.data as `0x${string}`);
    }
  }
  console.log(calldatas)

  if (calldatas.length === 0) {
    throw new Error('No valid calldata found in orderResponses');
  }

  let resolvedAccount: Address | Account;
  if (account) {
    resolvedAccount = account;
  } else {
    [resolvedAccount] = await walletClient.requestAddresses();
  }

  console.log(calldatas,"calldatas")

  // Encode the multicall function with the array of calldatas
  const multicallData = encodeFunctionData({
    abi: MulticallABI,
    functionName: 'multicall', // your contract must match this
    args: [calldatas],
  });
  console.log(multicallData,"multicalldata");
  // // Send the multicall transaction
  const txHash = await walletClient.sendTransaction({
    to:"0xd0d00Ee8457d79C12B4D7429F59e896F11364247",
    data: multicallData,
    account: resolvedAccount,
    chain,
  });
  console.log(txHash,"txHash");
  await resolvedPublicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash };
}

export async function sendOrderForViem(
  walletClient: WalletClient,
  chain_id: string,
  orderResponse: Eip155PrepareOrderResponse,
  account?: Account,
  publicClient?: PublicClient,
): Promise<{
  txHashes: `0x${string}`[];
}> {
  const chain = resolveViemChain(chain_id);

  let resolvedPublicClient = publicClient;
  if (!resolvedPublicClient) {
    resolvedPublicClient = createPublicClient({ transport: http(), chain });
  }

  const txDatas = orderResponse.transaction_data;
  if (!Array.isArray(txDatas) || txDatas.length === 0) {
    throw new Error('transaction_data is missing or empty');
  }

  let resolvedAccount: Address | Account;
  if (account) {
    resolvedAccount = account;
  } else {
    [resolvedAccount] = await walletClient.requestAddresses();
  }

  const txHashes: `0x${string}`[] = [];
  for (const txData of txDatas) {
    if (!txData || !txData.contract_address || !txData.data) {
      throw new Error('transaction_data item is missing required fields');
    }

    // 1. Sign and send transaction
    const txHash = await walletClient.sendTransaction({
      to: txData.contract_address as `0x${string}`,
      data: txData.data as `0x${string}`,
      account: resolvedAccount,
      chain,
    });

    // 2. Wait for the transaction to be mined before proceeding to the next
    await resolvedPublicClient.waitForTransactionReceipt({ hash: txHash });
    txHashes.push(txHash);
  }

  return { txHashes };
}

export async function signTransferPermitAndOrderForViem(
  walletClient: WalletClient,
  orderResponse: Eip155PrepareProxiedOrderResponse,
  account?: Account,
): Promise<{
  permitSignature: `0x${string}`;
  orderSignature: `0x${string}`;
}> {
  const { permit_typed_data, order_typed_data } = orderResponse;

  if (!permit_typed_data.domain || !permit_typed_data.types || !permit_typed_data.message) {
    throw new Error('permit_typed_data is missing required fields');
  }
  if (!order_typed_data.domain || !order_typed_data.types || !order_typed_data.message) {
    throw new Error('order_typed_data is missing required fields');
  }

  let resolvedAccount: Address | Account;
  if (account) {
    resolvedAccount = account;
  } else {
    [resolvedAccount] = await walletClient.requestAddresses();
  }

  const permitSignature = await walletClient.signTypedData({
    domain: permit_typed_data.domain,
    types: permit_typed_data.types as TypedData,
    primaryType: permit_typed_data.primaryType,
    message: permit_typed_data.message as Record<string, unknown>,
    account: resolvedAccount,
  });

  const orderSignature = await walletClient.signTypedData({
    domain: order_typed_data.domain,
    types: order_typed_data.types as TypedData,
    primaryType: order_typed_data.primaryType,
    message: order_typed_data.message as Record<string, unknown>,
    account: resolvedAccount,
  });

  return {
    permitSignature,
    orderSignature,
  };
}


