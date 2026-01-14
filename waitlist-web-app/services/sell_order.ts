import { useMutation } from "@tanstack/react-query";
import Dinari from "@dinari/api-sdk";
import { type Chain } from "@dinari/api-sdk/resources/v2/accounts";
import { type OrderSide, type OrderTif, type OrderType } from "@dinari/api-sdk/resources/v2/accounts/orders";
import { encodeFunctionData, formatUnits, parseAbi, parseEventLogs, parseUnits } from "viem";
import orderProcessorData from "@/lib/sbt-deployments/v0.4.0/order_processor.json";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useEnsureCorrectChain } from "@/utils/chainUtils";
import { toast } from "react-hot-toast";
import { api } from "@/config";
import { getFeeQuote } from "./fee_quote";
const tokenAbi = parseAbi([
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function version() view returns (string)",
    "function nonces(address owner) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
]);

const permitTypes = {
    Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
};

function getTokenAddress(chainId:any, tokens:any) {
    const entry = tokens.find((token: string) => token.split(":")[1] === String(chainId));
    return entry ? entry.split(":")[2] : null;
}

interface CreateSellOrderArgs {
    accountId: string;
    crateId: string;
    crateInvestmentData: any;
}

export function useSellOrderMutation() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const ensureCorrectChain = useEnsureCorrectChain();

    return useMutation({
        mutationFn: async ({ crateInvestmentData, accountId, crateId }: CreateSellOrderArgs) => {
            if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");

            // Ensure we're on the correct chain before proceeding
            const chainIsCorrect = await ensureCorrectChain();
            if (!chainIsCorrect) {
                toast.error("Please switch to Sepolia testnet in your wallet to continue");
                throw new Error("Incorrect chain - please switch to Sepolia testnet");
            }

            const id = toast.loading("Creating sell order...");

            const chainId = publicClient.chain.id;
            const orderProcessorAbi = orderProcessorData.abi;
            const orderProcessorAddress = (orderProcessorData.networkAddresses as Record<string, string>)[String(chainId)] as `0x${string}`;
            if (!orderProcessorAddress) throw new Error("Missing order processor address");

            // Fee quotes now handled by backend proxy to avoid CORS issues

            const multiCallBytes: string[] = [];
            const executableOrders: any[] = [];
            let totalUsdWithdrawn = 0;
            let totalFees = BigInt(0);

            // ✅ loop over crateInvestmentData.stockHoldings instead of "assets"

            const orders = [];
            for (const stock of crateInvestmentData.stockHoldings) {
                const _stock = stock.stockId;

                const assetTokenAddress = getTokenAddress(chainId, _stock.tokens);
                if (!assetTokenAddress) {
                    console.log(`⚠️ Skipping Stock ${_stock.dinari_id} (No token for chainId ${chainId})`);
                    continue;
                }

                const userBalance = await publicClient.readContract({
                    address: assetTokenAddress,
                    abi: tokenAbi,
                    functionName: "balanceOf",
                    args: [address],
                });

                const decimals = await publicClient.readContract({
                    address: assetTokenAddress,
                    abi: tokenAbi,
                    functionName: "decimals",
                    args: [],
                });
                const orderAmount = parseUnits(stock.sharesOwned.toString(), decimals);
                if (userBalance < orderAmount) {
                    console.log(`Skipping ${stock.stockId}, insufficient balance`);
                    continue;
                }


                const sellOrder = true;
                const orderType = 0;

                let actualAmount = orderAmount; 

                if (sellOrder) {
                    const allowedDecimalReduction = await publicClient.readContract({
                        address: orderProcessorAddress,
                        abi: orderProcessorAbi,
                        functionName: "orderDecimalReduction",
                        args: [assetTokenAddress],
                    });

                    const allowedDecimalReductionNum = Number(allowedDecimalReduction); // convert bigint → number
                    const assetTokenDecimals = Number(decimals); // decimals is bigint from contract
                    const maxDecimals = assetTokenDecimals - allowedDecimalReductionNum;

              

                    // scale = 10 ^ (assetTokenDecimals - allowedDecimalReduction)
                    const scale = BigInt(Math.pow(10, assetTokenDecimals - allowedDecimalReductionNum));

                    // Adjust the amount
                    actualAmount = (actualAmount / scale) * scale;

                

                    // allowablePrecisionReduction = 10 ^ allowedDecimalReduction
                    const allowablePrecisionReduction = BigInt(Math.pow(10, allowedDecimalReductionNum));

                    if (actualAmount % allowablePrecisionReduction !== BigInt(0)) {
                        throw new Error(`Order amount precision exceeds max decimals of ${maxDecimals}`);
                    }
                }
                const orderParams = {
                    requestTimestamp: Date.now(),
                    recipient: address,
                    assetToken: assetTokenAddress,
                    paymentToken: process.env.NEXT_PUBLIC_PAYMENTTOKEN,
                    sell: sellOrder,
                    orderType: orderType,
                    assetTokenQuantity: Number(actualAmount),
                    paymentTokenQuantity: 0,
                    price: 0,
                    tif: 1,
                };

                const _order = {
                    chain_id: `eip155:${chainId}` as Chain,
                    order_side: "SELL" as OrderSide,
                    order_tif: "DAY" as OrderTif,
                    order_type: "MARKET" as OrderType,
                    stock_id: _stock.dinari_id,
                    payment_token: process.env.NEXT_PUBLIC_PAYMENTTOKEN!,
                    asset_token_quantity: Number(actualAmount),
                };

              


        

                const feeQuoteResponse = await getFeeQuote({ accountId, order: _order });
                const orderFee = parseUnits(
                    feeQuoteResponse.fee,
                    6
                );
                totalFees += orderFee;
                orders.push({ orderParams, feeQuoteResponse });
                // Permit signing
                const nonce = await publicClient.readContract({
                    address: assetTokenAddress,
                    abi: tokenAbi,
                    functionName: "nonces",
                    args: [address],
                });
                const block = await publicClient.getBlock();
                const deadline = Number(block.timestamp) + 60 * 5;
                const tokenName = await publicClient.readContract({
                    address: assetTokenAddress,
                    abi: tokenAbi,
                    functionName: "name",
                });
                let tokenVersion = "1";
                try {
                    tokenVersion = await publicClient.readContract({
                        address: assetTokenAddress,
                        abi: tokenAbi,
                        functionName: "version",
                    });
                } catch { }

                const permitDomain = {
                    name: tokenName,
                    version: tokenVersion,
                    chainId,
                    verifyingContract: assetTokenAddress,
                } as const;

                const permitMessage = {
                    owner: address,
                    spender: orderProcessorAddress,
                    value: actualAmount,
                    nonce,
                    deadline,
                };

                const permitSig = await walletClient.signTypedData({
                    domain: permitDomain,
                    types: permitTypes,
                    primaryType: "Permit",
                    message: permitMessage,
                    account: address,
                });

                const v = parseInt(permitSig.slice(-2), 16);
                const r = `0x${permitSig.slice(2, 66)}` as `0x${string}`;
                const s = `0x${permitSig.slice(66, 130)}` as `0x${string}`;

                const selfPermitData = encodeFunctionData({
                    abi: orderProcessorAbi,
                    functionName: "selfPermit",
                    args: [assetTokenAddress, address, actualAmount, deadline, v, r, s],
                });

                console.log(`Order Number Approval : ${stock.stockId}`);
              
                multiCallBytes.push(selfPermitData);
                executableOrders.push({
                    stock: _stock._id,
                    sharesOwned: formatUnits(orderAmount, decimals),
                });
                totalUsdWithdrawn += Number(formatUnits(orderAmount, decimals)) * _stock.price;
            }

            console.log("Number of orders !!!",orders.length);
            const orderCalls = orders.map((order)=>{
                return encodeFunctionData({
                    abi: orderProcessorAbi,
                    functionName: "createOrder",
                    args: [
                        [
                            order.orderParams.requestTimestamp,
                            order.orderParams.recipient,
                            order.orderParams.assetToken,
                            order.orderParams.paymentToken,
                            order.orderParams.sell,
                            order.orderParams.orderType,
                            order.orderParams.assetTokenQuantity,
                            order.orderParams.paymentTokenQuantity,
                            order.orderParams.price,
                            order.orderParams.tif,
                        ],
                        [
                            order.feeQuoteResponse.order_fee_contract_object.fee_quote.orderId,
                            order.feeQuoteResponse.order_fee_contract_object.fee_quote.requester,
                            order.feeQuoteResponse.order_fee_contract_object.fee_quote.fee,
                            order.feeQuoteResponse.order_fee_contract_object.fee_quote.timestamp,
                            order.feeQuoteResponse.order_fee_contract_object.fee_quote.deadline,
                        ],
                        order.feeQuoteResponse.order_fee_contract_object.fee_quote_signature,
                    ],
                });
            });

            if (multiCallBytes.length === 0) throw new Error("No sell orders to process");

            const txHash = await walletClient.writeContract({
                address: orderProcessorAddress,
                abi: orderProcessorAbi,
                functionName: "multicall",
                args: [[...multiCallBytes, ...orderCalls]],
                account: address,
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });
            const orderEvents = receipt.logs
                .filter(log => log.address.toLowerCase() === orderProcessorAddress.toLowerCase())
                .flatMap(log => {
                    try {
                        return parseEventLogs({
                            abi: orderProcessorAbi,
                            logs: [log],
                            eventName: "OrderCreated",
                        });
                    } catch (err) {
                        return [];
                    }
                }); if (orderEvents.length === 0) throw new Error("No OrderCreated events found");

            const orderIds = orderEvents.map((event: any) => event?.args?.id?.toString());
            console.log(orderIds, "orderIds");
            // Push transaction to backend
            await api.post("/transactions", {
                wallet: address,
                crateId,
                type: "sell",
                orderIds,
                stockHoldings: executableOrders,
                totalAmountInvested: totalUsdWithdrawn,
                totalFeesDeducted: formatUnits(totalFees, 6),
                transactionHash: txHash,
                chainId,
            });
            toast.success("Sell order completed successfully", { id });
            return txHash;
        },
    });
}
