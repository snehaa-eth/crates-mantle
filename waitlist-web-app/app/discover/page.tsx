"use client";

import React, { useState } from "react";
import CrateCard, { Crate } from "@/components/CrateCard";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useGetAllCrates } from "@/hooks/user-hooks";
import { useEnrichedUser } from "@/hooks/user-hooks";
import { usePrivyAuth } from "@/context/PrivyAuthContext";

const volatilityOptions = [
  { label: "High Volatility", value: "high" },
  { label: "Medium Volatility", value: "medium" },
  { label: "Low Volatility", value: "low" },
];

const crateTypeOptions = [
  { label: "AI", value: "ai" },
  { label: "Politician", value: "politician" },
  { label: "Crypto", value: "crypto" },
  { label: "Military", value: "military" },
  { label: "Others", value: "others" },
];

const sortOptions = [
  { label: "Popularity", value: "popularity" },
];
const returnsOptions = ["1M", "6M", "1Y", "3Y"];
const orderOptions = ["High-Low", "Low-High"];

export default function DiscoverPage() {
  const [volatility, setVolatility] = useState<string[]>([]);
  const [crateTypes, setCrateTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [returns, setReturns] = useState("1M");
  const [order, setOrder] = useState("High-Low");
  const { data: crates, isLoading } = useGetAllCrates();
  const { address,authenticated } = usePrivyAuth();
  const { data: userData, isLoading:userLoading, error } = useEnrichedUser(address, authenticated);
  if (isLoading && userLoading && address) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!crates || crates?.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">No crates found</div>;
  }
  const subscribedIds = new Set(
    userData?.subscribedCrates.map((c: any) => c.crateId)
  );
  
  // extend crates with a boolean
  const cratesWithSubscription = crates.map((crate: any) => ({
    ...crate,
    isSubscribed: subscribedIds.has(crate._id),
  }));



  return (
    <div className="min-h-screen bg-[#0e0e0e] pt-24 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Filter and Search Bar */}
        <div className=" mb-8 sticky pt-2 top-[4.5rem] z-30 bg-[#0e0e0e]">
          <div className="absolute left-1/2 -translate-x-1/2 translate-y-[3.4rem] w-screen border-b border-[#272727] pb-4 top-0" style={{zIndex: 0}} />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-0 pb-4 relative z-10">
            <div className="flex gap-3 w-full md:w-auto">
              {/* Volatility Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 bg-[#232323] border-none text-white font-chakra justify-between"
                  >
                    Volatility
                    <span className="ml-2">▼</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#232323] mt-2 text-white font-chakra w-52 p-3">
                  {volatilityOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center justify-between py-1 cursor-pointer">
                      <span>{opt.label}</span>
                      <Checkbox
                        checked={volatility.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setVolatility((prev) =>
                            checked ? [...prev, opt.value] : prev.filter((v) => v !== opt.value)
                          );
                        }}
                        className="hover:bg-white border border-[#A1A1A1]"
                      />
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
              {/* Crate Type Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-36 bg-[#232323] border-none text-white font-chakra justify-between"
                  >
                    Crate type
                    <span className="ml-2">▼</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#232323] mt-2 text-white font-chakra w-44 p-3">
                  {crateTypeOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center justify-between py-1 cursor-pointer">
                      <span>{opt.label}</span>
                      <Checkbox
                        checked={crateTypes.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setCrateTypes((prev) =>
                            checked ? [...prev, opt.value] : prev.filter((v) => v !== opt.value)
                          );
                        }}
                        className="hover:bg-white border border-[#A1A1A1]"
                      />
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
              {/* Sort By Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-44 bg-[#232323] border-none text-white  hover:text-black font-chakra justify-between"
                  >
                    Sort by <span className="ml-1 text-gray-500 hover:text-black">{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                    <span className="ml-2">▼</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#232323] text-white font-chakra w-56 mt-2 p-4">
                  <div className="mb-2">
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      
                      Popularity
                      <input
                        type="radio"
                        checked={sortBy === "popularity"}
                        onChange={() => setSortBy("popularity")}
                        className="accent-white"
                      />
                    </label>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm mb-1">Returns</div>
                    <div className="flex gap-2">
                      {returnsOptions.map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={returns === r ? "secondary" : "outline"}
                          className={cn(
                            "rounded-md px-3 py-1 font-chakra text-white",
                            returns === r ? "bg-[#181818] border-none" : "bg-[#232323] border border-gray-600"
                          )}
                          onClick={() => setReturns(r)}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm mb-1">Order by</div>
                    <div className="flex gap-2">
                      {orderOptions.map((o) => (
                        <Button
                          key={o}
                          size="sm"
                          variant={order === o ? "secondary" : "outline"}
                          className={cn(
                            "rounded-md px-3 py-1 font-chakra text-white",
                            order === o ? "bg-[#EBEBEB] text-black border-none" : "bg-[#232323] border border-gray-600"
                          )}
                          onClick={() => setOrder(o)}
                        >
                          {o}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727272] w-4 h-4 pointer-events-none" />
              <Input
                className="bg-[#181818] border-none text-white font-chakra placeholder:text-[#727272] h-12 pl-10"
                placeholder="Search crates, creators and..."
              />
            </div>
          </div>
        </div>
       
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {cratesWithSubscription?.length && cratesWithSubscription?.map((crate, i) => (
            <CrateCard key={i} crate={crate} />
          ))}
        </div>
      </div>
    </div>
  );
} 