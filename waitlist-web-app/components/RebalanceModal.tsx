import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useBuyOrderMutation } from "@/services/buy_order";
import { useChainId } from "wagmi";
import { toast } from "react-hot-toast";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
import { useEnrichedUser } from "@/hooks/user-hooks";
import { useSellOrderMutation } from "@/services/sell_order";
interface RebalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crate?: {
    name?: string;
    description?: string;
    image?: string;
    imageUrl?: string;
    tvl: any;
    stocks: any;
    previousStocks: any;
  };
}



export function RebalanceModal({ open, onOpenChange, crate }: RebalanceModalProps) {
  const [step, setStep] = useState<'review' | 'status' | 'success'>('review');
  const [orderStatus, setOrderStatus] = useState<'waiting' | 'completed' | 'error'>('waiting');
  const [batchFilled, setBatchFilled] = useState(0);
  const [batchTotal] = useState(5);
  const chainId = useChainId();
  const { address, authenticated } = usePrivyAuth();
  const { data: userData, refetch: refetchUser } = useEnrichedUser(address, authenticated);
  function getTokenAddress(chainId: number, tokens: any) {
    const entry = tokens.find(token => token.split(":")[1] === String(chainId));
    return entry ? entry.split(":")[2] : null;
  }
  const getIsOnChain = (tokens: any) => {
    let val = tokens?.some(token =>
      token.startsWith(`eip155:${chainId}:`)
    );

    return val;
  }


  const {
    mutate: createBuyOrder,
    isPending: createBuyOrderLoading,
    isSuccess,
    error,
  } = useBuyOrderMutation();
    const { mutate: createSellOrder, isPending: createSellOrderLoading, isSuccess: isSellOrderSuccess } = useSellOrderMutation();
  function calculateRebalance(_crate: any) {

    return _crate?.stocks?.map((row: any) => {
      const stock = row.stock; // populated object
      const newWeight = row.weight;

      // Try to find previous stock by matching ID
      const prev = _crate?.previousStocks.find((s: any) => {
        const prevId = typeof s.stock === "object" ? s.stock._id.toString() : s.stock.toString();
        const currId = typeof stock === "object" ? stock._id.toString() : stock.toString();
        return prevId === currId;
      });

      const prevWeight = prev ? prev.weight : 0;

      // Convert weights to dollar values
      const prevValue = (prevWeight / 100) * _crate?.tvl;
      const newValue = (newWeight / 100) * _crate?.tvl;

      const diff = newValue - prevValue;

      let action: string | null = null;
      if (diff > 0) action = "Buy";
      else if (diff < 0) action = "Sell";

      return {
        symbol: stock.symbol || stock, // fallback if not populated
        stockData: stock,
        prevWeight,
        newWeight,
        action,
        amount: Math.abs(diff).toFixed(2) // $ amount to buy/sell
      };
    });
  }


  const actions = calculateRebalance(crate);
  console.log(actions);

  // Mock review data
  let subtotal = 0;
  // const slippage = 0.8;
  const priceImpact = '<0.1%';
  // const netReceivable = 55;
  const netExtra = 2;

  // Success mock data
  const filledRows = actions?.filter((a: any) => a.action);
  const totalBought = actions?.filter((a: any) => a.action === "Buy").length;
  const totalSold = actions?.filter((a: any) => a.action === "Sell").length;
  const totalRebalanced = actions?.reduce((sum: number, a: any) => sum + Number(a.amount), 0).toFixed(2);




  useEffect(() => {
    if (step === 'status') {
      setBatchFilled(0);
      setOrderStatus('waiting');
      let filled = 0;
      const interval = setInterval(() => {
        filled += 1;
        setBatchFilled(filled);
        if (filled === batchTotal) {
          clearInterval(interval);
          setTimeout(() => setOrderStatus('completed'), 500);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [step, batchTotal]);

  useEffect(() => {
    if (step === 'status' && orderStatus === 'completed') {
      const timer = setTimeout(() => setStep('success'), 1200);
      return () => clearTimeout(timer);
    }
  }, [step, orderStatus]);

  useEffect(() => {
    if (!open) {
      setStep('review');
      setBatchFilled(0);
      setOrderStatus('waiting');
    }
  }, [open]);


  const handleConfirmOrder = () => {
    setStep("status");

    // 1️⃣ Calculate the rebalance difference
    const rebalanceOrders = calculateRebalance(crate);

    // 2️⃣ Split into buy/sell
    const buyOrders = rebalanceOrders.filter((o) => o.action === "Buy");
    const sellOrders = rebalanceOrders.filter((o) => o.action === "Sell");

    console.log(buyOrders, sellOrders, "order");

    // 3️⃣ Perform Sell Orders First
    if (sellOrders.length > 0) {
      createSellOrder(
        {
          crateId: crate?._id,
          accountId: userData?.dinari_account_id,
          // If you need to pass what exactly to sell:
          assets: sellOrders.map((order) => ({
            stockObjectId: order.stockData._id,
            stockId: order.stockData.dinari_id,
            assetAddress: getTokenAddress(chainId, order.stockData.tokens),
            weightage: order.prevWeight,
            sellAmount: order.amount, 
            isOnchain: getIsOnChain(order.stockData.tokens),
          })),
          // crateInvestmentData,
        },
        {
          onSuccess: () => {
            toast.success("Sell order executed successfully.");
            refetchUser();
          },
        }
      );
    }

    // 4️⃣ Perform Buy Orders
    if (buyOrders.length > 0) {
      const totalAmountToBeInvested = buyOrders.reduce(
        (acc, order) => acc + Number(order.amount),
        0
      );
      createBuyOrder(
        {
          crateId: crate?._id,
          accountId: userData?.dinari_account_id,
          totalAmountToBeInvested,
          assets: buyOrders.map((order) => ({
            stockObjectId: order.stockData._id,
            stockId: order.stockData.dinari_id,
            assetAddress: getTokenAddress(chainId, order.stockData.tokens),
            weightage: order.newWeight,
            // buyAmount: order.amount, 
            isOnchain: getIsOnChain(order.stockData.tokens),
          })),
        },
        {
          onSuccess: () => {
            toast.success("Buy order executed successfully.");
            refetchUser();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md text-white bg-[#181818] p-0 rounded-2xl font-chakra max-h-[90vh] overflow-y-auto mx-4 my-6 sm:mx-0 sm:my-0">
        <div className="p-3">
          <div className="flex bg-[#121212] justify-between items-center p-2 ">
            <div className="text-2xl text-white font-bold">Rebalance</div>
            <button className="text-gray-400 hover:text-white" onClick={() => onOpenChange(false)}>
              <X className="text-white" size={20} />
            </button>
          </div>

          {/* Crate Info */}
          {step !== 'success' && (
            <div className="flex items-center gap-4 bg-[#232323] rounded-md p-3 mb-4 border border-[#484848]">
              <div className="p-[2px] rounded-lg" style={{ background: "linear-gradient(180deg, #8B8B8B 0%, #E9E9E9 50%, #8B8B8B 100%)" }}>
                <img src={crate?.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="crate" />
              </div>
              <div>
                <div className="text-lg font-semibold">{crate?.name}</div>
                <div className="text-xs text-[#A1A1A1]">{crate?.description || 'Democrat/House/California'}</div>
              </div>
            </div>

          )}

          {step === 'review' && (
            <>
              <div className="text-lg font-semibold mb-4">Review order</div>
              <div className="overflow-x-auto h-48 overflow-y-auto rounded-lg">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="text-[#A1A1A1] text-sm">
                      <th className="py-2 px-2 font-medium">Stock</th>
                      <th className="py-2 px-2 font-medium">Current Holding</th>
                      <th className="py-2 px-2 font-medium">New Allocation</th>
                      <th className="py-2 px-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions?.map((row: any, i: number) => {
                      subtotal += Number(row.amount);
                      return (
                        <tr key={i} className="border-t border-[#232323] text-base">
                          {/* Stock Symbol */}
                          <td className="py-2 px-2 flex items-center gap-2">
                            <img
                              src={crate?.stocks.find((s: any) => s.stock.symbol === row.symbol)?.stock.logo_url}
                              alt={row.symbol}
                              className="w-6 h-6 rounded"
                            />
                            {row.symbol}
                          </td>

                          {/* Current Weight */}
                          <td className="py-2 px-2">
                            {row.prevWeight.toFixed(2)}% (${((row.prevWeight / 100) * crate?.tvl).toFixed(2)})
                          </td>

                          {/* New Weight */}
                          <td className="py-2 px-2">
                            {row.newWeight.toFixed(2)}% (${((row.newWeight / 100) * crate?.tvl).toFixed(2)})
                          </td>

                          {/* Action */}
                          <td className="py-2 px-2">
                            {row.action ? (
                              <span className={row.action === "Buy" ? "text-green-400" : "text-red-400"}>
                                {row.action} ${row.amount}
                              </span>
                            ) : (
                              <span className="text-gray-400">No Action</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                  </tbody>

                </table>
              </div>
              <div className="mt-4 border-t border-[#232323] pt-4 space-y-2 text-base">
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1] text-sm">Subtotal Spend</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                {/* <div className="flex justify-between items-center">
                  <span className="text-[#A1A1A1] text-sm">Slippage</span>
                  <div>
                    <span className="font-bold">{slippage}</span>
                    <span className="ml-2 text-xs bg-[#232323] px-2 py-1 rounded text-[#A1A1A1]">Custom</span>
                  </div>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1] text-sm">Price Impact</span>
                  <span className="font-bold">{priceImpact}</span>
                </div>
                <div className="flex items-center text-lg mt-2 justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1A1A1] text-sm">Net Receivable:</span>
                    <span className="text-xs text-[#A1A1A1]">You'll receive ${netExtra} after rebalancing</span>
                  </div>
                  <button
                    className={`w-1/3 font-bold py-3 rounded text-lg`}
                    style={{
                      background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                      backgroundBlendMode: "normal, normal",
                      color: "#000"
                    }}
                    onClick={() => handleConfirmOrder()}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'status' && (
            <>
              {orderStatus === 'completed' && (
                <div className="flex flex-col items-center gap-2 text-green-400 text-xl font-semibold mb-2">
                  <span className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center">
                    <svg width="28" height="28" fill="none"><path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  All orders filled
                </div>
              )}
              {orderStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-xl font-semibold mb-2">
                  <span className="w-10 h-10 rounded-full bg-red-400 flex items-center justify-center">
                    <svg width="28" height="28" fill="none"><circle cx="14" cy="14" r="12" stroke="#fff" strokeWidth="2.5" /><path d="M14 9v6m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
                  </span>
                  Uh-oh, your order couldn't be placed
                </div>
              )}
              {orderStatus === 'waiting' && (
                <div className="flex items-center gap-2 text-gray-400 text-xl font-semibold mb-2">
                  <span className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center"></span>
                  Waiting for order status
                </div>
              )}
              <div className="flex justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-400">Batch</div>
                  <div className="text-base">Rebalance</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-base">
                    {orderStatus === 'completed' ? 'Completed' : orderStatus === 'error' ? 'Unplaced' : 'Waiting'}
                  </div>
                </div>
              </div>
              <div className="mb-4 text-xs">{batchFilled} of {batchTotal} filled</div>
              <div className="w-full h-6 bg-[#232323] rounded mb-6">
                <div
                  className={`h-6 rounded transition-all duration-500 ${orderStatus === 'completed' ? 'bg-green-400' : orderStatus === 'error' ? 'bg-gray-500' : 'bg-green-400'}`}
                  style={{
                    width: orderStatus === 'error'
                      ? '0%'
                      : `${(batchFilled / batchTotal) * 100}%`
                  }}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <button className="w-full md:flex-1 bg-[#232323] text-white py-3 rounded">View Portfolio</button>
                <button
                  className={`w-full md:flex-1 font-bold py-3 rounded text-lg`}
                  style={{
                    background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                    color: "#000"
                  }}
                >
                  View more Crates
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="flex flex-col items-center my-4">
                <img src="/assets/buy_tick.svg" alt="Success" className="w-14 h-14 mb-2" />
                <div className="text-lg w-3/4 font-semibold text-center mb-2">
                  Your selected Crate has been rebalanced successfully.
                </div>
              </div>
              <div className="border-[#484848] border-t p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A1A1A1]">Crate name</span>
                  <span className="font-bold">Pelosi Crate</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A1A1A1]">Total Rebalanced</span>
                  <span className="font-bold">${totalRebalanced}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A1A1A1]">Stocks sold/bought</span>
                  <span className="font-bold">
                    Sold <span className="text-red-400">{totalSold}</span> | Bought <span className="text-green-400">{totalBought}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#232323] rounded-md p-3 mb-4 border border-[#484848]">
                <div className="p-[2px] rounded-lg" style={{ background: "linear-gradient(180deg, #8B8B8B 0%, #E9E9E9 50%, #8B8B8B 100%)" }}>
                  <img src={crate?.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="crate" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{crate?.name}</div>
                  <div className="text-xs text-[#A1A1A1]">{crate?.description || 'Democrat/House/California'}</div>
                </div>
              </div>
              <div className="overflow-x-auto h-44 overflow-y-auto rounded-lg mb-4">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="text-[#A1A1A1] text-sm">
                      <th className="py-2 px-2 font-medium">Stock</th>
                      <th className="py-2 px-2 font-medium">Current Holding</th>
                      <th className="py-2 px-2 font-medium">New Allocation</th>
                      <th className="py-2 px-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filledRows.map((row: any, i: number) => (
                      <tr key={i} className="border-t border-[#232323] text-base">
                        <td className="py-2 px-2">{row.symbol}</td>
                        <td className="py-2 px-2">{row.prevWeight.toFixed(2)}% (${((row.prevWeight / 100) * crate.tvl).toFixed(2)})</td>
                        <td className="py-2 px-2">{row.newWeight.toFixed(2)}% (${((row.newWeight / 100) * crate.tvl).toFixed(2)})</td>
                        <td className="py-2 px-2">
                          <span className={row.action === "Buy" ? "text-green-400" : "text-red-400"}>
                            {row.action.toUpperCase()} ${row.amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <button
                  className="w-full md:flex-1 font-bold py-3 bg-[#232323] text-white rounded text-lg"
                >
                  View Portfolio
                </button>
                <button
                  className="w-full md:flex-1 font-bold py-3 rounded text-lg"
                  style={{
                    background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                    color: "#000"
                  }}
                >
                  View more Crates
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}





