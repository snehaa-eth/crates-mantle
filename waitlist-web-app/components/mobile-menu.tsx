"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoginButton from "@/components/LoginButton"
const menuItems = [
  { href: "/discover", label: "Discover" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/orders", label: "Orders" },
]
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
        <Menu className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0e0e0e]/20 dark:bg-[#0e0e0e]/40 backdrop-blur-sm z-40"
              onClick={closeMenu}
            />

            {/* Menu panel - match navbar look */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-0 left-0 right-0 bg-black border-b border-[#272727] z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <img src="/assets/logo_crates.svg" alt="Crates" className="h-8 w-auto" />
                    <span className="font-chakra text-lg">Crates</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeMenu} className="text-white">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="mt-4 space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className="flex items-center justify-between w-full px-2 py-3 rounded text-white hover:bg-[#111] transition-colors"
                    >
                      <span className="text-base font-chakra">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  ))}
                </nav>

                <div className="mt-4 pt-4 border-t border-[#272727]">
                  <div className="w-full">
                    <LoginButton />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
