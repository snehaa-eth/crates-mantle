"use client";


import { usePrivyAuth } from "@/context/PrivyAuthContext";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useUniversalWalletClient } from "@/utils/universalWalletClient";
import { sepolia } from "viem/chains";



export default function LoginButton() {
  const { customizeLogin, logout, address, authenticated } = usePrivyAuth();
  const { chainId, isExternalWallet, isPrivyWallet, getWalletClient } = useUniversalWalletClient();
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "";

  const copyToClipboard = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast("Address Copied!", { className: "font-ropa", duration: 5000 });
    }
  };

  const handleSwitchChain = async () => {
    try {
      console.log(isPrivyWallet);
      console.log(isExternalWallet);
      if (isPrivyWallet) {
        toast.info("Your Privy wallet auto-targets Sepolia in this app.");
        return;
      }
      const walletClient = await getWalletClient();
      await walletClient.switchChain({ id: sepolia.id });
      toast.success("Switched to Sepolia network");
    } catch (err) {
      toast.error("Failed to switch chain. Please switch manually.");
    }
  };

  const isSepolia = chainId === sepolia.id;

  return (
    <div className="flex flex-col items-center gap-2">
      {authenticated && address ? (
        <div className="flex gap-2 text-black">
          <button
            onClick={copyToClipboard}
            className="bg-[#0e0e0e] dark:bg-white font-ropa flex text-white px-4 py-2 font-medium text-md"
          >
            <span>{shortAddress}</span>
            <Copy className="h-4 w-4 mx-2 mt-1" />
          </button>

          <button
            onClick={logout}
            className="bg-[#0e0e0e] dark:bg-white font-ropa text-white px-4 py-2 font-medium text-md"
          >
            Logout
          </button>

          {!isSepolia && (
            <button
              onClick={handleSwitchChain}
              className="bg-yellow-500 font-ropa text-black px-4 py-2 font-medium text-md"
            >
              Switch to Sepolia
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={customizeLogin}
          className="bg-white font-ropa text-black px-4 py-2 font-medium text-md"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
