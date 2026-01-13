"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RebalanceModal } from "@/components/RebalanceModal";
import { useEnrichedUser, useGetAllCrates, useUserPortfolio } from "../../hooks/user-hooks";
import { usePrivyAuth } from "../../context/PrivyAuthContext";
import { Bug } from "lucide-react";
import toast from 'react-hot-toast';
import { getChainColor } from "@/utils/get_logo";
import Link from "next/link";
import { useBalance } from "wagmi";
export default function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeTab, setActiveTab] = useState("Crates");
  const { address, authenticated } = usePrivyAuth();
  const { data: userPortfolio, isLoading, error } = useUserPortfolio(address, authenticated);
  const { data: cratesData, isLoading: cratesLoading } = useGetAllCrates();
  const { data: userData, isLoading: userLoading } = useEnrichedUser(address, authenticated);
  const {
    data: nativeBalance,
    isLoading: nativeLoading,
  } = useBalance({
    address: address as `0x${string}`,
    enabled: !!address,
  });

  console.log(cratesData,"cratesData")

  const {
    data: tokenBalance,
    isLoading: tokenLoading,
  } = useBalance({
    address: address as `0x${string}`,
    token: "0x665b099132d79739462DfDe6874126AFe840F7a3",
  });

  console.log(tokenBalance,"tokenBalance")
  console.log(address,"address")

  const subscribedIds = new Set(
    userData?.subscribedCrates.map((c: any) => c.crateId)
  );

  const cratesWithSubscription = cratesData?.map((crate: any) => ({
    ...crate,
    isSubscribed: subscribedIds.has(crate._id),
  }));

  const [copyTradeToggles, setCopyTradeToggles] = useState(cratesWithSubscription?.map(() => false));
  const handleToggleCopyTrade = (idx: number) => {
    setCopyTradeToggles((toggles: any[]) => toggles.map((on, i) => i === idx ? !on : on));
  };

  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [selectedCrate, setSelectedCrate] = useState<any>(null);

  // Use real portfolio data for stocks, fallback to mock data
  const stocksData = userPortfolio?.portfolio?.assets?.map((asset: any) => {

    // Format token address with ellipsis
    const tokenAddress = asset?.token_address || '';
    const shortAddress = tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : '';

    return {
      logo: asset.logo_url,
      symbol: asset.symbol,
      chain_id: asset.chain_id,
      name: asset.symbol, // You might want to add a name field to your API
      address: shortAddress,
      fullAddress: tokenAddress, // Keep full address for copy functionality
      price: `$${asset.current_price?.toFixed(2) || '0.00'}`,
      holdings: `$${(parseFloat(asset.amount) * asset.current_price).toFixed(2)}`,
      owned: parseFloat(asset.amount).toFixed(6),
      netGain: "+0.00%", // This would come from your API if available
      netGainColor: "text-green-400", // Default to green, adjust based on actual data
    };
  });


  if (!mounted) {
    return <div className="text-center text-gray-400">Loading portfolio...</div>;
  }


  return (
    <div className="min-h-screen pt-24 md:pt-32 max-w-6xl w-full mx-auto flex flex-col bg-[#0e0e0e] text-white font-chakra">
      <main className="flex-1 flex flex-col items-center pb-16">
        <section className=" w-full">
          {!address ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Bug className="w-16 h-16 text-gray-400 mb-4" />
              <div className="text-2xl font-chakra text-center">Connect your wallet</div>
            </div>
          ) : (
            <>
              {/* Main Grid - Tabs and Profile Card at same level */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 md:gap-8"
              >
                {/* Left Side - Tabs and Content */}
                <div>
                  {/* Tabs */}
                  <div className="flex gap-6 md:gap-8 border-t pt-3 border-b border-[#232323] mb-0 px-2 md:px-0">
                    <button
                      className={`px-2 pb-2 text-base border-b-2 transition-all ${activeTab === "Crates"
                        ? "border-white text-white"
                        : "border-transparent text-gray-400"
                        }`}
                      onClick={() => setActiveTab("Crates")}
                    >
                      Crates
                    </button>
                    <button
                      className={`px-2 pb-2 text-base border-b-2 transition-all ${activeTab === "Stocks"
                        ? "border-white text-white"
                        : "border-transparent text-gray-400"
                        }`}
                      onClick={() => setActiveTab("Stocks")}
                    >
                      Your Holdings
                    </button>
                  </div>

                  {/* Stats Bar */}
                  <div className="border-b border-[#232323]">
                    <div className="grid grid-cols-3 w-full">
                      {/* Current Value */}
                      <div className="flex flex-col items-start justify-center px-3 py-3">
                        <div className="text-base md:text-2xl font-bold">
                          {nativeLoading ? "Loading..." : `${Number(nativeBalance?.formatted || 0).toFixed(2)} ETH`}
                        </div>
                        <div className="text-gray-400 text-[10px] md:text-sm mt-1">Native Balance</div>
                      </div>
                      {/* Total Invested */}
                      <div className="flex flex-col items-start justify-center px-3 py-3 border-l border-[#232323]">
                        <div className="text-base md:text-2xl font-bold">$501.29</div>
                        <div className="text-gray-400 text-[10px] md:text-sm mt-1">Total Invested</div>
                      </div>
                      <div className="flex flex-col items-start justify-center px-3 py-3 border-l border-[#232323]">
                        <div className="text-base md:text-2xl font-bold">
                          {tokenLoading ? "Loading..." : `$${Number(tokenBalance?.formatted || 0).toFixed(2)}`}
                        </div>
                        <div className="text-gray-400 text-[10px] md:text-sm mt-1">mockUSD Holding</div>
                      </div>
                    </div>
                  </div>

                  {/* Crate Cards or Stocks Table */}
                  {activeTab === "Crates" ? (
                    <div className="mt-5">
                      {cratesWithSubscription?.map((crate, i) => (
                        <motion.div
                          key={i}
                          className="relative flex items-center py-6 mb-0 border-b border-[#232323] last:border-b-0 bg-transparent rounded-none shadow-none"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.08 }}
                        >
                          {/* Avatar + Info in same row */}
                          <div className="flex items-start gap-8 flex-1 min-w-0">
                            {/* Avatar with blue shadow and border, square */}
                            <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
                              {/* Blue radial glow, larger than the image */}
                              <div
                                className="absolute left-1/2 top-1/2"
                                style={{
                                  width: 64, // larger than image
                                  height: 64,
                                  transform: "translate(-50%, -50%)",
                                  background: "radial-gradient(circle, #2563eb 60%, transparent 100%)",
                                  filter: "blur(6px)",
                                  opacity: 0.8,
                                  zIndex: 0,
                                  borderRadius: "16px",
                                }}
                              />
                              {/* Avatar image */}
                              <img
                                src={crate.imageUrl}
                                alt="avatar"
                                className="w-12 h-12 object-cover rounded-xl border-2 border-white relative z-10"
                                style={{ display: "block" }}
                              />
                            </div>
                            {/* Info */}
                              <div className="flex-1 min-w-0 mt-0.5">
                              <div className="flex items-center gap-2 md:gap-4 mb-0.5">
                                <span className="font-semibold text-base truncate"><Link href={`/discover/${crate?._id?.toString()}`}>{crate.name}</Link></span>
                                {/* {crate.notification && (
                              <span className="ml-2 w-2 h-2 rounded-full bg-orange-400 inline-block" title="Needs rebalance" />
                            )} */}
                              </div>
                              <div className="text-gray-400 text-xs mb-1 truncate">{crate.description.slice(0, 40)}...</div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:flex md:gap-20 mt-4 text-xs md:text-sm">
                                {/* <div>
                                  <div className="font-semibold text-xl">{crate.currentValue}</div>
                                  <div className="text-gray-400 text-xs">Current Value</div>
                                </div> */}
                                <div>
                                  <div className="font-semibold text-xl">${Number(crate.tvl).toFixed(2)}</div>
                                  <div className="text-gray-400 text-xs">Total Invested</div>
                                </div>
                                <div>
                                  <div className="text-green-400 font-semibold text-lg md:text-xl">{crate.activeSubscribers}</div>
                                  <div className="text-gray-400 text-xs">Active Subscribers</div>
                                </div>
                                <div>
                                  <div className="text-green-400 font-semibold text-lg md:text-xl">{crate?.stocks?.length}</div>
                                  <div className="text-gray-400 text-xs">Stocks Holding</div>
                                </div>
                                <div>
                                  <div className="text-green-400 font-semibold text-lg md:text-xl">{crate.monthlyReturnPercent}%</div>
                                  <div className="text-gray-400 text-xs">This month</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Right side: Rebalance + Copy Trade + menu */}
                          <div className="flex flex-row items-end gap-2 md:absolute md:right-2 md:top-1/2 md:-translate-y-10 mt-4 md:mt-0">
                            <div className="flex gap-2">
                              <button

                                className="bg-[#FFDBAC1A] border border-[#595959] text-[#FFDBAC] px-4 py-[0.3rem] rounded text-xs font-medium transition"
                                onClick={() => { 
                                  console.log(crate,"crate")
                                  setSelectedCrate(crate); 
                                  setRebalanceModalOpen(true); 
                                }}
                              >
                                Rebalance
                              </button>
                              {/* <button className="bg-[#232323]  text-white px-4 py-[0.3rem] rounded text-xs font-medium flex items-center gap-1  transition">
                            Copy Trade
                            <CustomToggle isOn={copyTradeToggles[i+1]} onToggle={() => handleToggleCopyTrade(i)} />
                          </button> */}
                            </div>
                            <div className="text-gray-500 cursor-pointer text-lg ">&#8942;</div>
                          </div>
                        </motion.div>
                      ))}

                      <div className="mt-8 flex justify-center">
                        <button className="border border-gray-600 px-6 py-2 rounded text-gray-300 transition">
                          Discover more crates
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto rounded-lg ">
                        <table className="w-full text-left text-white text-xs md:text-base table-auto">
                          <thead>
                            <tr className="text-[#A1A1A1] text-xs md:text-sm">
                              <th className="py-3 px-2 font-medium">Stock</th>
                              <th className="py-3 px-2 font-medium hidden md:table-cell">ChainId</th>
                              <th className="py-3 px-2 font-medium hidden md:table-cell">Token Address</th>
                              <th className="py-3 px-2 font-medium">Price</th>
                              <th className="py-3 px-2 font-medium">Holdings</th>
                              <th className="py-3 px-2 font-medium hidden md:table-cell">Owned</th>
                              {/* <th className="py-3 px-2 font-medium">Net gain</th> */}
                              <th className="py-3 px-2 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {stocksData?.map((stock: any, i: number) => (
                              <tr key={i} className="border-t border-[#232323]">
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-3">
                                    <img src={stock.logo} alt={stock.symbol} className="w-8 h-8 rounded" />
                                    <div className="min-w-0">
                                      <div className="font-semibold text-sm md:text-base">{stock.symbol}</div>
                                      <div className="text-[10px] md:text-xs text-[#B6B6B6]">{stock.name}</div>
                                      {/* Mobile-only extra info */}
                                      <div className="md:hidden text-[10px] text-[#B6B6B6] truncate">
                                        <span className="mr-2">{stock?.chain_id}</span>
                                        <span className="truncate inline-block max-w-[120px] align-bottom">{stock.address}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 hidden md:table-cell">
                                  <div className={`flex items-center gap-2 ${getChainColor(stock?.chain_id)}`}>
                                    <span className="text-md text-white">{stock?.chain_id}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 hidden md:table-cell">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[180px]">{stock.address}</span>
                                    {stock.fullAddress && (
                                      <button
                                        className="ml-1 hover:opacity-80 transition-opacity"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(stock.fullAddress);
                                            toast.success("Token address copied!");
                                          } catch (err) {
                                            console.error('Failed to copy token address:', err);
                                            toast.error("Failed to copy token address.");
                                          }
                                        }}
                                        title="Copy token address"
                                      >
                                        <img src="/assets/copy.svg" alt="copy" className="w-4 h-4 opacity-60" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2">{stock.price}</td>
                                <td className="py-3 px-2">{stock.holdings}</td>
                                <td className="py-3 px-2 hidden md:table-cell">{stock.owned}</td>
                                {/* <td className={`py-3 px-2 font-semibold ${stock.netGainColor}`}>{stock.netGain}</td> */}
                                <td className="py-3 px-2">

                                  <img src="/assets/circle-info.svg" alt="info" className="w-4 h-4 opacity-70" />

                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-8 flex justify-center">
                        <button className="border border-gray-600 px-6 py-2 rounded text-gray-300 transition">
                          Discover more crates
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* Right Side - Profile Card */}
                <motion.div

                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <div className="bg-transparent rounded-lg p-8 flex flex-col items-center border border-[#232323] shadow-none">
                    <img
                      src="https://t3.ftcdn.net/jpg/06/99/46/60/360_F_699466075_DaPTBNlNQTOwwjkOiFEoOvzDV0ByXR9E.jpg"
                      className="w-20 h-20 rounded-full border-2 border-black mb-2"
                      alt="main avatar"
                    />
                    <div className="bg-[#232323] text-white text-xs px-3 py-1 rounded-full mb-2">
                      {`${address?.slice(0, 4)}...${address?.slice(-4)}`}
                    </div>
                    {/* <div className="text-gray-400 text-center text-xs mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    </div> */}
                    <div className="flex gap-8 mb-2">
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-base">+12.45%</div>
                        <div className="text-xs text-gray-400">Total Returns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-base">+4.90%</div>
                        <div className="text-xs text-gray-400">This month</div>
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="font-bold text-base">3,490</div>
                        <div className="text-xs text-gray-400">Subscribers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-base">34</div>
                        <div className="text-xs text-gray-400">Stocks</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              {/* Rebalance Modal (moved outside the map and tab content) */}
              <RebalanceModal
                open={rebalanceModalOpen}
                onOpenChange={setRebalanceModalOpen}
                crate={selectedCrate}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function CustomToggle({ isOn, onToggle }: { isOn: boolean, onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`ml-1 w-10 h-5 rounded-md cursor-pointer flex items-center transition-colors duration-200 ${isOn ? '' : 'bg-[#232323]'}`}
      style={{ background: isOn ? 'linear-gradient(90deg, #f472b6 0%, #fde68a 100%)' : '#232323', border: '1px solid #595959', position: 'relative' }}
    >
      <div
        className={`bg-white w-4 h-4 rounded-md shadow transition-transform duration-200`}
        style={{ transform: isOn ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </div>
  );
}