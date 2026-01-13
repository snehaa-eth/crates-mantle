import React from 'react'
import LoginButton from '../LoginButton'
import { usePathname } from "next/navigation";
import Link from 'next/link'
import { MobileMenu } from "@/components/mobile-menu";
import { motion, AnimatePresence } from "framer-motion";
const MemoizedMobileMenu = React.memo(MobileMenu);
const Navbar = () => {
  const pathname = usePathname();
  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between py-4 z-50 bg-[#0e0e0e] backdrop-blur-sm">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 md:gap-10">
          <Link href="/" className="text-sm tracking-wide flex items-center gap-2 font-ropa text-white">
            <img src="/assets/crates.png" alt="Use Crates Logo" className="h-10 md:h-16 w-auto" />
            <span className="text-white text-xl md:text-2xl font-chakra">Crates</span>
          </Link>
          {/* <nav className="flex items-center gap-8 text-sm font-ropa">
            <Link href="/crates" className={pathname === "/crates" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Crates
            </Link>
            <Link href="/portfolio" className={pathname === "/portfolio" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Portfolio
            </Link>
            <Link href="/watchlist" className={pathname === "/watchlist" ? "text-white" : "text-gray-400 hover:text-white transition-colors"}>
              Watchlist
            </Link>
          </nav> */}
        </div>

        <div className="flex-1 flex items-center justify-end space-x-2 md:space-x-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center space-x-1 px-2 md:px-4 py-2"
          >
            <LoginButton />
          </motion.div>
          <div className="md:hidden">
            <MemoizedMobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar