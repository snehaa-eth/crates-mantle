import Link from "next/link";
import { motion } from "framer-motion";
import LoginButton from "@/components/LoginButton";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MobileMenu } from "@/components/mobile-menu";
import { useBalance, useChainId } from "wagmi";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
import {  useTreasuryFundWallet } from "@/hooks/user-hooks";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { address, authenticated } = usePrivyAuth();
  const { mutate: fundWallet, isPending: isFunding } = useTreasuryFundWallet();
  
  // Mock USD token address (same as used in portfolio page)
  const mockUsdTokenAddress = process.env.NEXT_PUBLIC_PAYMENTTOKEN || "0x665b099132d79739462DfDe6874126AFe840F7a3";
  
  // Check balance for mock USD token
  const { data: tokenBalance, isLoading: balanceLoading } = useBalance({
    address: authenticated && address ? (address as `0x${string}`) : undefined,
    token: mockUsdTokenAddress as `0x${string}`,
  });

  const balance = tokenBalance ? Number(tokenBalance.formatted) : 0;
  const showDripButton = authenticated && address && !balanceLoading && balance < 5;

  const handleDrip = () => {
    if (!address) return;
    fundWallet(
      { wallet: address as `0x${string}`},
      {
        onSuccess: () => {
          // Balance will automatically refetch via useBalance
        },
      }
    );
  };

  return (
    <header className="fixed top-0 left-0 font-chakra right-0 z-50 bg-black border-b border-[#272727] py-4">
      <div className="max-w-6xl mx-auto px-4 md:px-0 flex items-center justify-between ">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-4 md:gap-10">
          <Link href="/" className="text-sm tracking-wide flex items-center gap-2 text-white">
            <img src="/assets/logo_crates.svg" alt="Use Crates Logo" className="h-8 md:h-10 w-auto" />
            <span className="text-white text-lg md:text-xl font-chakra">Crates</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/discover" className={pathname === "/discover" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Discover
            </Link>
            <Link href="/portfolio" className={pathname === "/portfolio" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Portfolio
            </Link>
            <Link href="/orders" className={pathname === "/orders" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Orders
            </Link>
            {/* <Button
              disabled={isPending}
              onClick={() => fundWallet({ wallet: address as `0x${string}`, chain_id: chainId })} className="text-white bg-inherit">
              Fund Wallet
            </Button> */}
          </nav>
        </div>
        {/* Right: Wallet/Account Button */}
        <div className="flex items-center gap-2 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden md:flex items-center gap-4"
          >
            <Image src="/assets/bell.svg" alt="Notifications" height={24} width={24} />
            {authenticated && address && (
              <div className="flex items-center gap-2 text-white text-sm">
                {balanceLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  <span className="font-medium">${balance.toFixed(2)} mockUSD</span>
                )}
              </div>
            )}
            {showDripButton && (
              <Button
                onClick={handleDrip}
                disabled={isFunding}
                className="text-xs p-0 bg-transparent border-none hover:bg-transparent"
              >
                {isFunding ? "Dripping..." : <DownloadIcon className="w-4 h-4" />}
              </Button>
            )}
            <LoginButton />
          </motion.div>
          {/* Mobile menu */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
