import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
import { useEnrichedUser } from "@/hooks/user-hooks";
import { useBuyOrderMutation } from "@/services/buy_order";
import { useBalance, useChainId } from "wagmi";
import { sepolia } from "viem/chains";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BuyCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crate?: {
    name?: string;
    meta?: string;
    image?: string;
  };
  stocks?: any[];
  basket_id?: string;
}
function getTokenAddress(chainId: number, tokens: any) {
  const entry = tokens.find((token: string) => token.split(":")[1] === String(chainId));
  return entry ? entry.split(":")[2] : null;
}




export function BuyCrateModal({ open, onOpenChange, crate, stocks = [] }: BuyCrateModalProps) {
  const router = useRouter();
  // crate: { name, meta, image }
  const [step, setStep] = useState<'input' | 'review' | 'status' | 'success'>('input');
  const [amount, setAmount] = useState('');
  // Use payment token from config or stock data
  const paymentTokenAddress = process.env.NEXT_PUBLIC_PAYMENTTOKEN || (stocks[0]?.stock?.tokens?.[1]?.split(':')[2]) || '';
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [balance, setBalance] = useState(0);
  const [orderStatus, setOrderStatus] = useState<'waiting' | 'completed' | 'error'>('waiting');
  const [batchFilled, setBatchFilled] = useState(0);
  const [batchTotal, setBatchTotal] = useState(stocks.length || 1);
  const chainId = useChainId()
  // Auth and user data
  const { address, authenticated } = usePrivyAuth();
  const { data: userData, refetch: refetchUser } = useEnrichedUser(address, authenticated);
  const { mutate: createBuyOrder, isPending: createBuyOrderLoading } = useBuyOrderMutation();
  // ERC20 balance for mock USDC token
  const { data: usdcBalance } = useBalance({
    address: address as `0x${string}`,
    token: paymentTokenAddress as `0x${string}`,
  });

  // Update balance when USDC balance changes
  useEffect(() => {
    if (usdcBalance) {
      setBalance(Number(usdcBalance.formatted));
    }
  }, [usdcBalance]);

  const getIsOnChain = (tokens:any)=>{
    let val = tokens?.some((token: string) =>
      token.startsWith(`eip155:${chainId}:`)
    );
  
    return val ;
  }


  const handleInvest = () => {
    if (!userData?.dinari_account_id) {
      toast.error("Please complete KYC to invest in crates.");
      return;
    }
    
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (Number(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    console.log({crate});
    console.log('Current chainId:', chainId);

    // Debug the asset mapping
    const assets = stocks?.map((stockItem: { stock: { tokens: any; symbol: any; _id: any; dinari_id: any; }; weight: any; }) => {
      const assetAddress = getTokenAddress(chainId, stockItem.stock.tokens);
      const isOnchain = getIsOnChain(stockItem.stock.tokens);
      
      console.log('Stock:', stockItem.stock.symbol);
      console.log('Available tokens:', stockItem.stock.tokens);
      console.log('Asset address found:', assetAddress);
      console.log('Is onchain:', isOnchain);
      
      return {
        stockObjectId: stockItem.stock._id,
        stockId: stockItem.stock.dinari_id,
        assetAddress,
        weightage: stockItem.weight,
        isOnchain
      };
    });

    console.log('Final assets:', assets);

    createBuyOrder(
      {
        crateId: crate?._id,
        accountId: userData?.dinari_account_id,
        totalAmountToBeInvested: amount,
        assets: assets || [],
      },
      {
        onSuccess: () => {
          toast.success("Invested in crate successfully.");
          refetchUser();
        },
        onError: (error) => {
          console.error('Buy order error:', error);
          toast.error("Failed to create buy order. Check console for details.");
        },
      }
    );
  };

  // Mock order review data
  const subtotal = amount ? parseFloat(amount) : 0;
  const slippage = 0.8; // fallback value
  const priceImpact = '<0.1%'; // fallback value
  const fee = 0; // fallback value
  const totalSpend = subtotal + fee;



  // When orderStatus is completed, go to success after a short delay
  useEffect(() => {
    if (step === 'status' && orderStatus === 'completed') {
      const timer = setTimeout(() => setStep('success'), 1200);
      return () => clearTimeout(timer);
    }
  }, [step, orderStatus]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('input');
      setAmount('');
      setSelectedToken('USDC');
      setBatchFilled(0);
      setOrderStatus('waiting');
    }
  }, [open]);

  const isCorrectChain = chainId === sepolia.id;
  const disabled = !amount || parseFloat(amount) <= 0 || !isCorrectChain;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-xl text-white bg-[#181818] p-0 rounded-2xl font-chakra max-h-[90vh] overflow-y-auto mx-4 my-6 sm:mx-0 sm:my-0">
        <div className="p-3">
          <div className="flex bg-[#121212] justify-between items-center p-2 ">
            <div className="text-2xl text-white font-bold">Buy crate</div>
            <button className="text-gray-400 hover:text-white" onClick={() => onOpenChange(false)}>
              <X className="text-white" size={20} />
            </button>
          </div>

          {/* Crate Info */}
          {step !== 'success' && (
            <div className="flex items-center text-white border-[#484848] border bg-[#232323] rounded-md p-3 my-4">
              <div className="p-[2px] rounded-lg" style={{ background: "linear-gradient(180deg, #8B8B8B 0%, #E9E9E9 50%, #8B8B8B 100%)" }}>
                <img src={crate?.image || "/public/placeholder-user.jpg"} className="w-12 h-12 rounded-lg object-cover" alt="crate" />
              </div>
              <div className="ml-2">
                <div className="text-lg font-semibold">{crate?.name}</div>
                <div className="text-xs text-[#A1A1A1]">{crate?.meta}</div>
              </div>
            </div>
          )}
          {step === 'input' ? (
            <>
              {/* Token Select */}
              <div className="text-center mb-2 text-lg font-medium">Select Token and Asset</div>
              <div className="flex justify-center mb-2">
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-32 bg-[#181818] border border-[#232323] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#232323] text-white">
                    <SelectItem value="USDC">
                      <span className="flex items-center gap-2">
                        <img src="/assets/usdc.svg" alt="usdc" className="w-5 h-5" /> USDC
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center text-gray-400 mb-4">
                Balance: ${balance.toLocaleString()}
              </div>
              {/* Amount Input */}
              <div className="flex justify-center mb-2">
                <input
                  className="text-6xl bg-transparent text-center w-40 outline-none font-chakra"
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  type="text"
                  style={{ letterSpacing: '0.05em' }}
                />
              </div>
              <div className="text-center text-gray-400 mb-4">
                {amount ? `${parseFloat(amount).toFixed(2)} USD` : '0 USD'} &nbsp; 1 {selectedToken} = 1.00 USD
              </div>
              {/* Quick Select */}
              <div className="flex justify-center gap-4 mb-4">
                <button className="bg-[#3D3D3D] text-white px-6 py-1 rounded" onClick={() => setAmount("50")}>Min</button>
                <button className="bg-[#2C2C2C] text-white px-6 py-1 rounded" onClick={() => setAmount((balance * 0.25).toFixed(2))}>25%</button>
                <button className="bg-[#2C2C2C] text-white px-6 py-1 rounded" onClick={() => setAmount((balance * 0.5).toFixed(2))}>50%</button>
                <button className="bg-[#3D3D3D] text-white px-6 py-1 rounded" onClick={() => setAmount(balance.toFixed(2))}>Max</button>
              </div>
              <div className="text-center text-[#C9C9C9] mb-2">
                Choose the amount you'd like to invest into the {crate?.name} crate
              </div>
              <button
                className={`w-full font-bold py-3 rounded text-lg${disabled ? ' cursor-not-allowed' : ''}`}
                style={disabled ? {
                  background: "linear-gradient(180deg, #444 0%, #888 100%)",
                  color: "#222",
                  boxShadow: "0 2px 8px 0 #00000040, 0 1.5px 0 #222 inset",
                  opacity: 0.7
                } : {
                  background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                  backgroundBlendMode: "normal, normal",
                  color: "#000"
                }}
                onClick={() => setStep('review')}
                disabled={disabled}
              >
                Preview
              </button>
            </>
          ) : step === 'review' ? (
            <>
              <div className="text-lg font-semibold mb-4">Review order</div>
              <div className="overflow-x-auto h-48 overflow-y-auto rounded-lg">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="text-[#A1A1A1] text-sm">
                      <th className="py-2 px-2 font-medium">Logo</th>
                      <th className="py-2 px-2 font-medium">Symbol</th>
                      <th className="py-2 px-2 font-medium">Name</th>
                      <th className="py-2 px-2 font-medium">Price</th>
                      <th className="py-2 px-2 font-medium">Weight</th>
                      <th className="py-2 px-2 font-medium">On Chain?</th> {/* new column */}
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock, i) => {
                      const isOnChain = stock?.stock?.tokens?.some((token: string) =>
                        token.startsWith(`eip155:${chainId}:`)
                      );

                      return (
                        <tr key={i} className="border-t border-[#232323] text-base">
                          <td className="py-2 px-2">
                            <img
                              src={stock?.stock?.logo_url}
                              alt={stock?.stock?.symbol}
                              className="w-8 h-8 rounded bg-white"
                            />
                          </td>
                          <td className="py-2 px-2">{stock?.stock.symbol}</td>
                          <td className="py-2 px-2">{stock?.stock.name}</td>
                          <td className="py-2 px-2">
                            {amount
                              ? (parseFloat(amount) * (stock.weight / 100)).toFixed(2)
                              : "0"}
                          </td>
                          <td className="py-2 px-2">{stock.weight.toFixed(2)}%</td>
                          <td className="py-2 px-2">
                            {isOnChain ? (
                              <span className="text-green-500">Available</span>
                            ) : (
                              <span className="text-red-500">Not Available</span>
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
                  <span className="text-[#A1A1A1]">Subtotal Spend</span>
                  <span className="font-bold">${amount ? parseFloat(amount).toFixed(2) : '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A1A1A1]">Slippage</span>
                  <div>
                    <span className="font-bold">{slippage}</span>
                    <span className="ml-2 text-xs bg-[#232323] px-2 py-1 rounded text-[#A1A1A1]">Custom</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A1]">Price Impact</span>
                  <span className="font-bold">{priceImpact}</span>
                </div>
                
                <div className="flex items-center text-lg mt-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#A1A1A1]">Total Spend:</span>
                    <span className="font-bold text-white">${totalSpend}</span>
                  </div>
                  <button
                    className={`w-1/2 mt-4 font-bold py-3 rounded text-lg${disabled ? ' cursor-not-allowed' : ''}`}
                    style={disabled ? {
                      background: "linear-gradient(180deg, #444 0%, #888 100%)",
                      color: "#222",
                      boxShadow: "0 2px 8px 0 #00000040, 0 1.5px 0 #222 inset",
                      opacity: 0.7
                    } : {
                      background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                      backgroundBlendMode: "normal, normal",
                      color: "#000"
                    }}
                    onClick={handleInvest}
                    disabled={disabled || createBuyOrderLoading}
                  >
                    {createBuyOrderLoading ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>

            </>
          ) : step === 'status' ? (
            <>

              {orderStatus === 'completed' && (
                <div className="flex items-center gap-2 text-green-400 text-xl font-semibold mb-2">
                  <span className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                    <svg width="18" height="18" fill="none"><path d="M5 9l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  All orders filled
                </div>
              )}
              {orderStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-xl font-semibold mb-2">
                  <span className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center">
                    <svg width="18" height="18" fill="none"><circle cx="9" cy="9" r="8" stroke="#fff" strokeWidth="2" /><path d="M9 5v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                  </span>
                  Uh-oh, your order couldn't be placed
                </div>
              )}
              {orderStatus === 'waiting' && (
                <div className="flex items-center gap-2 text-gray-400 text-xl font-semibold mb-2">
                  <span className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center"></span>
                  Waiting for order status
                </div>
              )}
              <div className="flex justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-400">Batch</div>
                  <div className="text-base">Buy</div>
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
                <button className="w-full md:flex-1 bg-[#232323] text-white py-3 rounded" onClick={() => router.push('/portfolio')}>View Portfolio</button>
                <button
                  className={`w-full md:flex-1 font-bold py-3 rounded text-lg${disabled ? ' cursor-not-allowed' : ''}`}
                  style={disabled ? {
                    background: "linear-gradient(180deg, #444 0%, #888 100%)",
                    color: "#222",
                    boxShadow: "0 2px 8px 0 #00000040, 0 1.5px 0 #222 inset",
                    opacity: 0.7
                  } : {
                    background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                    color: "#000"
                  }}
                  onClick={() => onOpenChange(false)}
                >
                  Buy More
                </button>

              </div>
            </>
          ) : (

            <>
              <div className="flex flex-col items-center my-4">
                <img src="/assets/buy_tick.svg" alt="Success" className="w-14 h-14 mb-2" />
                <div className="text-lg w-3/4 font-semibold text-center mb-2">
                  Your selected holdings have been sold successfully.
                </div>
              </div>
              <div className="border-[#484848] border-t p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A1A1A1]">Crate name</span>
                  <span className="font-bold">{crate?.name}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A1A1A1]">Amount Bought</span>
                  <span className="font-bold">${amount}</span>
                </div>

              </div>
              <div className="flex items-center text-white border-[#484848] border bg-[#232323] rounded-md p-3 my-2">
                <div className="p-[2px] rounded-lg" style={{ background: "linear-gradient(180deg, #8B8B8B 0%, #E9E9E9 50%, #8B8B8B 100%)" }}>
                  <img src={crate?.image || "/public/placeholder-user.jpg"} className="w-12 h-12 rounded-lg object-cover" alt="crate" />
                </div>
                <div className="ml-2">
                  <div className="text-lg font-semibold">{crate?.name}</div>
                  <div className="text-xs text-[#A1A1A1]">{crate?.meta}</div>
                </div>
              </div>
              <div className="overflow-x-auto h-40 overflow-y-auto rounded-lg mb-4">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="text-[#A1A1A1] text-sm">
                      <th className="py-2 px-2 font-medium">Logo</th>
                      <th className="py-2 px-2 font-medium">Symbol</th>
                      <th className="py-2 px-2 font-medium">Name</th>
                      <th className="py-2 px-2 font-medium">Price</th>
                      <th className="py-2 px-2 font-medium">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock, i) => (
                      <tr key={i} className="border-t border-[#232323] text-base">
                        <td className="py-2 px-2">
                          <img src={stock?.stock?.logo_url} alt={stock?.stock?.symbol} className="w-8 h-8 rounded bg-white" />
                        </td>
                        <td className="py-2 px-2">{stock?.stock.symbol}</td>
                        <td className="py-2 px-2">{stock?.stock.name}</td>
                        <td className="py-2 px-2">${stock?.stock.price}</td>
                        <td className="py-2 px-2">{stock.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <button className="w-full md:flex-1 bg-[#232323] text-white py-3 rounded" onClick={() => router.push('/portfolio')}>View Portfolio</button>
                <button
                  className={`w-full md:flex-1 font-bold py-3 rounded text-lg${disabled ? ' cursor-not-allowed' : ''}`}
                  style={disabled ? {
                    background: "linear-gradient(180deg, #444 0%, #888 100%)",
                    color: "#222",
                    boxShadow: "0 2px 8px 0 #00000040, 0 1.5px 0 #222 inset",
                    opacity: 0.7
                  } : {
                    background: "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                    color: "#000"
                  }}
                  onClick={() => onOpenChange(false)}
                >
                  Buy More
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 