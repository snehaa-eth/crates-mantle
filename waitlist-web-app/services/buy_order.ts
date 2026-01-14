import { useMutation } from "@tanstack/react-query";
import Dinari from "@dinari/api-sdk";
import {
    encodeFunctionData,
    formatUnits,
    parseAbi,
    parseEventLogs,
    parseUnits,
} from "viem";
import orderProcessorData from "@/lib/sbt-deployments/v0.4.0/order_processor.json";
import { usePublicClient } from "wagmi";
import { useUniversalWalletClient } from "@/utils/universalWalletClient";
import { useEnsureCorrectChain } from "@/utils/chainUtils";
import { toast } from "sonner";
import { api } from "@/config";
import { getFeeQuote } from "./fee_quote";

const tokenAbi = parseAbi([
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function version() view returns (string)",
    "function nonces(address owner) view returns (uint256)",
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

interface BuyOrderInput {
    stockId: string;
    assetAddress: string;
    stockObjectId: string;
    weightage: number;
    isOnchain: Boolean;
}

interface CreateBuyOrderArgs {
    assets: BuyOrderInput[];
    accountId: string;
    crateId: string;
    totalAmountToBeInvested: string;
}

export function useBuyOrderMutation() {
    const { getWalletClient, address } = useUniversalWalletClient();
    const publicClient = usePublicClient();
    const ensureCorrectChain = useEnsureCorrectChain();

    return useMutation({
        mutationFn: async ({
            assets,
            accountId,
            crateId,
            totalAmountToBeInvested,
        }: CreateBuyOrderArgs) => {
            console.log('Buy order - address:', address);
            console.log('Buy order - address type:', typeof address);
            console.log('Buy order - address length:', address?.length);
            
            if (!address || !publicClient)
                throw new Error("Wallet not connected");
            if (!accountId || !assets || assets.length === 0) {
                toast.error("Invalid account ID or orders");
                throw new Error("Invalid account ID or orders");
            }

            // Ensure we're on the correct chain before proceeding
            const chainIsCorrect = await ensureCorrectChain();
            if (!chainIsCorrect) {
                toast.error("Please switch to Sepolia testnet in your wallet to continue");
                throw new Error("Incorrect chain - please switch to Sepolia testnet");
            }

            let id = toast.loading("Buying...");
            console.log("button clicked")

            const chainId = publicClient.chain.id;
            const paymentTokenAddress =
                process.env.NEXT_PUBLIC_PAYMENTTOKEN as `0x${string}`;

            const orderProcessorAbi = orderProcessorData.abi;
            const orderProcessorAddress = (orderProcessorData.networkAddresses as Record<
                string,
                string
            >)[String(chainId)] as `0x${string}`;
            if (!orderProcessorAddress)
                throw new Error("Missing order processor address");

            const dinariClient = new Dinari({
                apiKeyID: process.env.NEXT_PUBLIC_DINARI_API_KEY_ID,
                apiSecretKey: process.env.NEXT_PUBLIC_DINARI_API_SECRET_KEY,
                environment: "sandbox",
            });

            const totalAmountBigInt = parseUnits(
                totalAmountToBeInvested,
                6
            );
            totalAmountToBeInvested = totalAmountBigInt.toString();



            const totalWeight = assets.reduce((sum, asset) => sum + asset.weightage, 0);

            const orders = [];
            let totalOrderAmount = BigInt(0);
            let totalFees = BigInt(0);

            for (const asset of assets) {
                if (!asset.isOnchain) {
                    continue;
                }
                const rawAmount = Math.ceil(
                    (asset.weightage / totalWeight) * Number(totalAmountToBeInvested)
                );
                const paymentTokenQuantity = rawAmount.toString();
                const formattedQuantity = BigInt(paymentTokenQuantity.toString()) / BigInt(10 ** 6)
                console.log(totalWeight, asset.weightage, paymentTokenQuantity, rawAmount);
                console.log(paymentTokenQuantity, formattedQuantity, "formattedQuantity");
                if (!formattedQuantity) {

                    continue;
                }
                const _order = {
                    chain_id: `eip155:${chainId}`,
                    order_side: "BUY",
                    order_tif: "DAY",
                    order_type: "MARKET",
                    stock_id: asset.stockId,
                    payment_token: paymentTokenAddress,
                    payment_token_quantity: formattedQuantity.toString(),
                };

                const orderParams = {
                    requestTimestamp: Date.now(),
                    recipient: address,
                    assetToken: asset.assetAddress,
                    paymentToken: paymentTokenAddress,
                    sell: false,
                    orderType: 0,
                    assetTokenQuantity: 0,
                    paymentTokenQuantity: paymentTokenQuantity,
                    price: 0,
                    tif: 1,
                };

                const quote = await dinariClient.v2.marketData.stocks.retrieveCurrentQuote(
                    asset.stockId
                );
                const askPrice = Number(quote.ask_price);


                const feeQuoteResponse = await getFeeQuote({ accountId, order: _order });
                console.log(feeQuoteResponse, "feeQuoteResponse");

                const orderFee = parseUnits(
                    feeQuoteResponse.fee,
                    6
                );
                const orderFeeReadable = Number(formatUnits(orderFee, 6));
                const paymentReadable = Number(formatUnits(BigInt(paymentTokenQuantity), 6));

                let netSpend = paymentReadable - orderFeeReadable;
                let minShares = netSpend / askPrice;
                if (!isFinite(minShares) || isNaN(minShares)) {
                    minShares = 0;
                }

                totalOrderAmount += BigInt(paymentTokenQuantity);
                totalFees += orderFee;

                orders.push({
                    _order,
                    orderParams,
                    feeQuoteResponse,
                    orderFee,
                    minShares,
                    priceUsed: askPrice,
                    stockId: asset.stockId,
                    stockObjectId: asset.stockObjectId,
                });
            }

            const totalSpendAmount = totalOrderAmount + totalFees;
            console.log({ totalSpendAmount })
            console.log({ orders });

            // ----- Permit -----
            const nonce = await publicClient.readContract({
                address: paymentTokenAddress,
                abi: tokenAbi,
                functionName: "nonces",
                args: [address],
            });
            const block = await publicClient.getBlock();
            const deadline = Number(block.timestamp) + 60 * 5;

            const tokenName = await publicClient.readContract({
                address: paymentTokenAddress,
                abi: tokenAbi,
                functionName: "name",
            });
            let tokenVersion = "1";
            try {
                tokenVersion = await publicClient.readContract({
                    address: paymentTokenAddress,
                    abi: tokenAbi,
                    functionName: "version",
                });
            } catch { }

            const permitDomain = {
                name: tokenName,
                version: tokenVersion,
                chainId,
                verifyingContract: paymentTokenAddress,
            } as const;

            const permitMessage = {
                owner: address,
                spender: orderProcessorAddress,
                value: totalSpendAmount,
                nonce,
                deadline,
            };

            const walletClient = await getWalletClient();
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
                args: [paymentTokenAddress, address, totalSpendAmount, deadline, v, r, s],
            });
            console.log({ selfPermitData })

            // ----- Build multicall -----


            const orderCalls = orders.map((order) =>
                encodeFunctionData({
                    abi: orderProcessorAbi,
                    functionName: "createOrder",
                    args: [[
                        order?.orderParams.requestTimestamp,
                        order?.orderParams.recipient,
                        order?.orderParams.assetToken,
                        order?.orderParams.paymentToken,
                        order?.orderParams.sell,
                        order?.orderParams.orderType,
                        order?.orderParams.assetTokenQuantity,
                        order?.orderParams.paymentTokenQuantity,
                        order?.orderParams.price,
                        order?.orderParams.tif,
                    ], [
                        order?.feeQuoteResponse.order_fee_contract_object.fee_quote.orderId,
                        order?.feeQuoteResponse.order_fee_contract_object.fee_quote.requester,
                        order?.feeQuoteResponse.order_fee_contract_object.fee_quote.fee,
                        order?.feeQuoteResponse.order_fee_contract_object.fee_quote.timestamp,
                        order?.feeQuoteResponse.order_fee_contract_object.fee_quote.deadline,
                    ],
                    order?.feeQuoteResponse.order_fee_contract_object.fee_quote_signature,
                    ],
                })
            );
            console.log({ orderCalls })


            const txHash = await walletClient.writeContract({
                address: orderProcessorAddress,
                abi: orderProcessorAbi,
                functionName: "multicall",
                args: [[selfPermitData, ...orderCalls]],
                account: address,
                chain: publicClient.chain,
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            console.log({ txHash })


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
            const bodyObject = {
                totalAmountInvested: formatUnits(totalAmountBigInt, 6),
                type: "buy",
                wallet: address,
                crateId,
                chainId,
                totalFeesDeducted: formatUnits(totalFees, 6),
                transactionHash: txHash,
                stockHoldings: orders.map((o) => ({
                    sharesOwned: o.minShares,
                    stock: o.stockObjectId,
                })),
                orderIds,
            };
            const res = await api.post(`/transactions`, bodyObject);
            console.log({ res });
            toast.success("Invested in crate successfully.",{id});
            return { txHash, backendResponse: res.data };
        },
    });
}
