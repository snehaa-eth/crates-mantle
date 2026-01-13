"use client";
import Footer from "@/components/commons/footer";
import Navbar from "@/components/commons/launch-navbar";
import React from "react";

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <main className="min-h-screen bg-[#0e0e0e] text-white font-chakra">
      <Navbar/>
      {children}
      <Footer />
    </main>
  );
} 