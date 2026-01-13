import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEnrichedUser, useSubscribeCrate } from "@/hooks/user-hooks";
import { useUniversalWallet } from "@/hooks/useUniversalWallet";
import toast from "react-hot-toast";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
export type Crate = {
  name: string;
  description: string;
  imageUrl: string;
  subscriptionAmount: string;
  totalReturnPercent: string;
  activeSubscribers: string;
  stocks: string;
  isSubscribed: boolean;
  _id?: string;
};

const CrateCard = ({ crate }: { crate: Crate }) => {

  const {
    mutate: subscribeCrate,
    isPending,
    isSuccess: subscribeSuccess,
    isError,
  } = useSubscribeCrate();

  const { address, authenticated } = usePrivyAuth();
  const { refetch: refetchUser } = useEnrichedUser(
    address,
    authenticated
  );
  const handleSubscribe = () => {
    if (!address) {
      toast.error("Please connect your wallet to subscribe.");
      return;
    }

    subscribeCrate(
      { wallet: address, crateId: crate?._id as string },
      {
        onSuccess: () => {
          toast.success("Subscribed to crate successfully.");
          refetchUser();
          //todo refresh the page after subcribing
        },
      }
    );

  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1b1b1b]/80 backdrop-blur-md p-5 shadow-lg hover:shadow-2xl transition-all"
    >
      {/* Header with image, name, and bookmark */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={
              crate.imageUrl ||
              "https://t3.ftcdn.net/jpg/06/99/46/60/360_F_699466075_DaPTBNlNQTOwwjkOiFEoOvzDV0ByXR9E.jpg"
            }
            className="w-16 h-16 rounded-xl object-cover shadow-md"
            alt={crate?.name}
          />
          <div>
            <h3 className="text-white font-semibold text-xl leading-snug cursor-pointer">
              <Link href={`/discover/${crate?._id?.toString()}`}>{crate?.name}</Link>
            </h3>
            <p className="text-gray-400 text-sm font-medium line-clamp-2">
              {crate?.description}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2b2b2b] hover:bg-[#333] transition-colors cursor-pointer">
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v18l7-5 7 5V3z"
            />
          </svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-green-400 font-semibold text-2xl">
            {crate.totalReturnPercent}
          </p>
          <p className="text-gray-400 text-sm font-medium">Total Returns</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-green-400 font-semibold text-2xl">
            {crate.subscriptionAmount}
          </p>
          <p className="text-gray-400 text-sm font-medium">This Month</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-white font-semibold text-2xl">
            {crate.activeSubscribers}
          </p>
          <p className="text-gray-400 text-sm font-medium">Subscribers</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-white font-semibold text-2xl">
            {crate.stocks.length}
          </p>
          <p className="text-gray-400 text-sm font-medium">Stocks</p>
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        {crate?.isSubscribed ? (
          <Button
            href={`/discover/${crate?._id?.toString()}`}
            className="flex-1 font-semibold rounded-lg py-3 shadow-md hover:shadow-lg transition-all"
            style={{
              background: "linear-gradient(135deg, #2e2e2e, #3a3a3a)",
              color: "white",
            }}
          >
            Explore
          </Button>
        ) : (
          <Button
            className="w-full !font-bold bg-white text-black"
            style={{
              background:
                "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
            }}
            disabled={isPending}
            onClick={handleSubscribe}
          >
            {isPending ? "Subscribing..." : "Subscribe"}
          </Button>
        )}
      </div>

    </motion.div>
  );
};

export default CrateCard;
