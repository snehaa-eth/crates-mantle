"use client";
import { AnimatedBackground } from "@/components/animated-background";
import Footer from "@/components/commons/footer";
import Navbar from "@/components/commons/navbar";
import React from "react";
const MemoizedAnimatedBackground = React.memo(AnimatedBackground);
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex  flex-col items-center justify-start bg-[#0e0e0e] ">
      <MemoizedAnimatedBackground />
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
