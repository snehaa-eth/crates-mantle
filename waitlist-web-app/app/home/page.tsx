"use client";
import { motion } from "framer-motion";
import CrateCard, { Crate } from "@/components/CrateCard";
import { Button } from "@/components/ui/button";

import { usePrivyAuth } from "@/context/PrivyAuthContext";
import { useEnrichedUser, useGetAllCrates } from "@/hooks/user-hooks";
import { useMemo } from "react";


export default function LaunchPage() {

  const { address, authenticated } = usePrivyAuth();
  const { data: userData, isLoading, error } = useEnrichedUser(address, authenticated);
  const { data: cratesData, isLoading: cratesLoading } = useGetAllCrates();

  const subscribedIds = new Set(
    userData?.subscribedCrates.map((c: any) => c.crateId)
  );

  // extend crates with a boolean
  const cratesWithSubscription = cratesData?.map((crate: any) => ({
    ...crate,
    isSubscribed: subscribedIds.has(crate._id),
  }));
  const stats = useMemo(() => {
    if (!cratesData) return { tvl: 0, totalTransactions: 0, totalSubscribers: 0 };

    return cratesData.reduce(
      (acc, crate) => {
        acc.tvl += Number(crate.tvl) ?? 0;
        acc.totalTransactions += crate.transactions?.length ?? 0;
        acc.totalSubscribers += crate.activeSubscribers ?? 0;
        return acc;
      },
      { tvl: 0, totalTransactions: 0, totalSubscribers: 0 }
    );
  }, [cratesData]);

  console.log(cratesData)
  const crates = [
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      returns: "+12.45%",
      thisMonth: "+4.90%",
      subscribers: "3,490",
      stocks: "34",
    },
    {
      name: "Brandon Gill",
      party: "Republican/House/Texas",
      image: "/assets/image.png",
      returns: "+12.45%",
      thisMonth: "+4.90%",
      subscribers: "3,490",
      stocks: "12",
    },
    {
      name: "Marjorie Taylor Greene",
      party: "Republican/House/Georgia",
      image: "/assets/image.png",
      returns: "+12.45%",
      thisMonth: "+4.90%",
      subscribers: "3,490",
      stocks: "15",
    },
  ];

  const investmentInsights = [
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "popular", label: "Popular", icon: <img src="/placeholder-user.jpg" className="w-8 h-8 rounded-full border-2 border-green-500" alt="Popular" /> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "trending", label: "Trending", icon: <span className="text-yellow-400 text-2xl">👌</span> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "trending", label: "Trending", icon: <span className="text-yellow-400 text-2xl">👌</span> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "popular", label: "Popular", icon: <img src="/placeholder-user.jpg" className="w-8 h-8 rounded-full border-2 border-green-500" alt="Popular" /> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "trending", label: "Trending", icon: <span className="text-yellow-400 text-2xl">👌</span> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
    {
      name: "John Hickenlooper",
      party: "Democrat/Senate/Colorado",
      image: "/assets/image.png",
      tag: { type: "trending", label: "Trending", icon: <span className="text-yellow-400 text-2xl">👌</span> },
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    },
  ];

  return (
    <>
      {/* Full-screen Overview Section */}
      <section className="w-full mt-16 bg-[#141414] flex items-center justify-center py-6 md:py-0">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 md:gap-8 px-4 md:px-8">
          <div className="flex-1 flex flex-col rounded-lg p-4 md:p-8">
            <span className="text-2xl md:text-4xl font-chakra text-[#A0A0A0] font-bold">Overview</span>
          </div>
          <div className="flex-[2] grid grid-cols-3 gap-3 md:gap-8">
            <div className="flex-1 flex flex-col rounded-lg p-2 md:p-8">
              <span className="text-lg md:text-3xl font-chakra text-white font-bold">{stats?.totalTransactions}</span>
              <span className="text-[10px] md:text-base text-[#A1A1A1] font-chakra mt-1 md:mt-2">Total Transactions</span>
            </div>
            <div className="flex-1 flex flex-col rounded-lg p-2 md:p-8">
              <span className="text-lg md:text-3xl font-chakra text-white font-bold">{stats?.totalSubscribers}</span>
              <span className="text-[10px] md:text-base text-[#A1A1A1] font-chakra mt-1 md:mt-2">Total Subscribers</span>
            </div>
            <div className="flex-1 flex flex-col rounded-lg p-2 md:p-8">
              <span className="text-lg md:text-3xl font-chakra text-white font-bold">${stats?.tvl.toFixed(2)}</span>
              <span className="text-[10px] md:text-base text-[#A1A1A1] font-chakra mt-1 md:mt-2">Total Value Locked</span>
            </div>
          </div>
        </div>
      </section>
      {" "}
      <section className="max-w-7xl mx-auto mt-10 px-4 font-chakra">
        <div className="flex flex-col md:flex-row bg-[#191919] rounded-xs p-4 md:px-10 w-full justify-between gap-6 md:gap-10">
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <h1 className="text-2xl md:text-4xl font-chakra font-bold leading-tight mb-2 break-words">
              <span
                style={{
                  background:
                    "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "inline",
                }}
              >
                Invest into Health
                <br />
                <span className="text-white/70">US stocks seamlessly</span>
              </span>
            </h1>
            <p className="text-[#A0A0A0] font-chakra text-lg mt-4 max-w-md">
              Buy groups of US stocks based on investors and domains, don’t
              invest alone
            </p>
          </div>

          <motion.div
            className="rounded-xl bg-[#1a1a1a] py-3 px-4 relative overflow-hidden md:w-[40%] w-full"
            style={{
              borderWidth: "3px",
              borderStyle: "solid",
              borderImage:
                "linear-gradient(180deg, #2B00FF 0%, #FFFFFF 7.09%, #2B00FF 16.02%, #FF4C4C 29.77%, #FFFFFF 42.52%, #FF4C4C 54.15%, #FFFFFF 64.67%) 1",
            }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <img src="/assets/image.png" className="w-10 h-10 rounded" />
              <div>
                <h2 className="text-lg font-semibold">Nancy Pelosi</h2>
                <p className="text-sm text-gray-400">
                  Democrat/House/California
                </p>
              </div>
              <span className="ml-auto px-2 py-0.5 border rounded text-sm">
                super
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Nancy Pelosi's stock trades have sparked controversy and memes,
              with many retail investors tracking her portfolio like it's a
              cheat code for Wall Street.
            </p>

            <div className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-8 text-sm mb-4 font-chakra">
              <div>
                <p className="text-green-400 font-semibold">+12.45%</p>
                <p>Total Returns</p>
              </div>
              <div>
                <p className="text-green-400 font-semibold">+4.90%</p>
                <p>This month</p>
              </div>
              <div>
                <p className="font-semibold">3,490</p>
                <p>Subscribers</p>
              </div>
              <div>
                <p className="font-semibold">34</p>
                <p>Stocks</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Button
                href={"/discover/689090741310baca7450a37c"}
                className="w-full md:flex-1 text-white font-bold rounded-lg py-3 px-0 border-none shadow-none"
                style={{
                  background:
                    "linear-gradient(0deg, #232323, #232323), linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                  backgroundBlendMode: "normal, normal",
                }}
              >
                View details
              </Button>
              {!address ? (
                <Button
                  className="w-full md:flex-1 text-black font-bold rounded-lg py-3 px-0 border-none shadow-none"
                  style={{
                    background:
                      "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                  }}
                >
                  Connect Wallet
                </Button>
              ) : userData?.is_kyc_complete && address ? (
                <Button
                  className="w-full md:flex-1 text-black font-bold rounded-lg py-3 px-0 border-none shadow-none"
                  style={{
                    background:
                      "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                    backgroundBlendMode: "normal, normal",
                  }}
                >
                  Subscribe
                </Button>
              ) : null}

            </div>
          </motion.div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto mt-16 px-4">
        <h2 className="text-3xl font-chakra font-bold mb-8">
          Top Trending crates
        </h2>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cratesWithSubscription?.length && cratesWithSubscription?.map((crate, i) => (
            <CrateCard key={i} crate={crate} />
          ))}
        </div>
      </section>


      <section className="max-w-7xl mx-auto mt-16 px-4 mb-10">
        <div className="bg-[#191919] rounded-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-chakra font-bold mb-4" style={{
              background:
                "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              display: "inline",
            }}>
              Invest in Top US stocks
            </h2>
            <p className="text-[#A0A0A0] font-chakra text-sm max-w-md">
              Find different crates of stocks based on domains, risk and
              investors, or create your own crate today
            </p>
          </div>
          <Button
            href={"/discover"}
            className="mt-6 md:mt-0 w-full md:w-auto px-8 py-3 text-md font-chakra text-black font-bold rounded-xl border-none shadow-none"
            style={{
              background:
                "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
              backgroundBlendMode: "normal, normal",
            }}
          >
            Explore now
          </Button>
        </div>
      </section>

      {/* Investment Insights Table Section */}
      <section className="max-w-7xl mx-auto mt-10 px-4">
        <h2 className="text-3xl font-chakra font-bold mb-8">Investment Insights</h2>
        <div className="flex flex-col max-h-[300px] overflow-y-auto gap-6">
          {investmentInsights.map((insight, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#272727] px-4 md:px-6 py-2 gap-3">
              <div className="flex items-center gap-2">
                <img src={insight.image} className="w-10 h-10 rounded-xl object-cover" alt={insight.name} />
                <div>
                  <p className="text-white font-semibold text-lg leading-tight">{insight.name}</p>
                  <p className="text-[#A1A1A1] text-sm font-chakra font-medium">{insight.party}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <div className="flex items-center gap-2">
                  {insight.tag.icon}
                  <span className={`font-bold text-md font-chakra ${insight.tag.type === "popular" ? "text-green-400" : "text-yellow-400"}`}>{insight.tag.label}</span>
                </div>
                <div className="flex-1  text-[#A1A1A1] text-sm font-chakra">{insight.description}</div>
              </div>
              <button className="w-full md:w-auto md:ml-8 px-6 md:px-16 py-2 font-chakra bg-[#232323] text-white rounded-md font-medium">View Crate</button>
            </div>
          ))}
        </div>
      </section>
      <section className="max-w-7xl mx-auto mt-16 px-4 mb-10">
        <div className="bg-[#191919] rounded-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-chakra font-bold mb-4" style={{
              background:
                "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              display: "inline",
            }}>
              Create your custom crates
            </h2>
            <p className="text-[#A0A0A0] font-chakra text-sm max-w-md">
              Choose the stocks you want to add, select their weights, and
              publish under 2 minutes!
            </p>
          </div>
          <Button
            className="mt-6 md:mt-0 w-full md:w-auto px-8 py-3 text-md font-chakra text-black font-bold rounded-xl border-none shadow-none"
            style={{
              background:
                "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
              backgroundBlendMode: "normal, normal",
            }}
          >
            Create a Crate
          </Button>
        </div>
      </section>
    </>
  );
}
