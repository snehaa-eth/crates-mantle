"use client"

import type React from "react"
import { motion } from "framer-motion"
import { AnimatedBackground } from "@/components/animated-background"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { Suspense } from "react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-[#0e0e0e] font-ropa dark:bg-gray-900">
      <AnimatedBackground />
    
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex-1 flex items-center justify-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200"
          >
            Use Crates
          </motion.div>
        </div>


      
      </header>


      <div className="flex flex-col mt-[120px] items-center justify-center min-h-[80vh] w-full relative px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                type: "spring",
                stiffness: 100,
              }}
              className="text-7xl md:text-8xl lg:text-9xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white tracking-tight leading-[1.15] pb-2"
            >
              404
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-2xl text-gray-700 dark:text-gray-300 mb-8"
            >
              Oops! The page you're looking for doesn't exist.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Link href="/">
                <Button
                  className="bg-[#0e0e0e] dark:bg-white dark:text-black text-white px-8 py-6 rounded-2xl text-xl font-medium transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center gap-3"
                >
                  <Home className="w-6 h-6" />
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Suspense>
      </div>

 
    </main>
  )
} 