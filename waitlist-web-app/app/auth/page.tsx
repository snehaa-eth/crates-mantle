"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

import { usePrivyAuth } from "@/context/PrivyAuthContext";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useWaitlist } from "@/hooks/useWaitlist";
import { useCheckWaitlist } from "@/hooks/useCheckWaitlist";
import { useRouter } from "next/navigation";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

// Animation variants
const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const modalVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 },
};

export default function Home() {
  const [email, setEmail] = useState("");
  const { address, authenticated } = usePrivyAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { joinWaitlist } = useWaitlist();
  const { checkWaitlist } = useCheckWaitlist();
  const [inviteCode, setInviteCode] = useState(["", "", "", ""]);
  const [isInviteCodeModalOpen, setIsInviteCodeModalOpen] = useState(false);
  const [isJoinSuccessModalOpen, setIsJoinSuccessModalOpen] = useState(false);
  // const router = useRouter();
  // useEffect(() => {
  //   const isVerified = localStorage.getItem("isVerified");
  //   console.log(isVerified, address, "address");
  //   if (isVerified === "true" && address) {
  //     router.push("/launch");
  //   } else {
  //     router.push("/auth");
  //   }
  // }, [address])
  const handleCodeInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...inviteCode];
    newCode[index] = value;
    setInviteCode(newCode);

    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  const handleCodeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && inviteCode[index] === "" && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleInviteCodeCheck = async () => {
    if (!address || !authenticated) {
      toast.error("Please connect your wallet to join the waitlist.");
      return;
    }
    const code = inviteCode.join("");
    if (code.length < 4) {
      toast.error("Please enter a valid 4-digit invite code.");
      return;
    }
    await checkWaitlist(address, code);
  };

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    []
  );
  const handleJoinSuccessModalOpen = useCallback(() => {
    setIsJoinSuccessModalOpen(true);
  }, []);
  const handleJoinSuccessModalClose = useCallback(() => {
    setIsJoinSuccessModalOpen(false);
  }, []);
  const handleInviteCodeModalOpen = useCallback(() => {
    setIsInviteCodeModalOpen(true);
  }, []);
  const handleInviteCodeModalClose = useCallback(() => {
    setIsInviteCodeModalOpen(false);
  }, []);
  const handleWaitlistSubmit = async () => {
    // if (!address || !authenticated) {
    //   toast.error("Please connect your wallet to join the waitlist.");
    //   return;
    // }
    if (!email) {
      toast.error("Please Enter Email Address.");
      return;
    }
    try {
      const joinWaitlistResponse = await joinWaitlist(email);
      if (joinWaitlistResponse) {
        setIsJoinSuccessModalOpen(true);
      }else{
        throw new Error("Failed to join waitlist");
      }
    } catch (err) {
      // error toast is already shown by the hook
    }
  };

  // Rive animation for join success modal
  const { RiveComponent: JoinSuccessRive } = useRive({
    src: "/animate.riv",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  const invitecodeModal = useMemo(
    () => (
      <div className="space-y-6">
        <div className="text-center">
          <h3  className="font-chakra text-2xl sm:text-4xl  font-bold leading-tight tracking-[-0.02em] bg-clip-text text-transparent text-center"
            style={{
              background:
                "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            Enter Invite Code
          </h3>
          <p className="text-md text-[#A0A0A0] font-chakra mt-2 text-center ">
            Enter your 4-digit invite code
          </p>
        </div>
        <div className="flex justify-center gap-4 mt-4 font-chakra">
          {inviteCode.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              id={`code-${idx}`}
              value={digit}
              onChange={(e) => handleCodeInput(e, idx)}
              onKeyDown={(e) => handleCodeKeyDown(e, idx)}
              className="w-12 h-14 text-center text-white bg-[#1c1c1c] border border-gray-600 rounded text-xl font-mono focus:outline-none focus:ring-2 focus:ring-white"
            />
          ))}
        </div>

        <Button
          onClick={handleInviteCodeCheck}
          disabled={isLoading || inviteCode.join("").length < 4}
          className={cn(
            "w-full bg-white text-black font-chakra hover:bg-white py-4  rounded-none mt-6 font-semibold transition-colors",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? "Verifying..." : "Join Waitlist"}
        </Button>
      </div>
    ),
    [inviteCode, error, isLoading]
  );

  const joinSuccessModal = useMemo(
    () => (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="max-w-[90px] mb-4 w-full flex justify-center items-center">
            <JoinSuccessRive /> || <img src="/assets/success.svg" alt="success" className="w-full max-w-[90px]" />
          </div>
        </div>
        <div className="text-center">
          <h3
            className="font-chakra text-2xl sm:text-4xl  font-bold leading-tight tracking-[-0.02em] bg-clip-text text-transparent text-center"
            style={{
              background:
                "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            You have been added to our waitlist
          </h3>
          <p className="text-md text-[#A0A0A0] font-chakra mt-2 text-center ">
            Thank you for joining, you’ll be the first to know when we are ready
          </p>
        </div>

        <Button
          onClick={()=>{
            window.open("https://x.com/use_crates", "_blank");
          }}
          className={cn(
            "w-full bg-white text-black font-chakra hover:bg-white py-4  rounded-none mt-6 font-semibold transition-colors"
          )}
        >
          Follow Us on X
        </Button>
      </div>
    ),
    [inviteCode, error, isLoading]
  );

  return (
    <>
      <section className="w-full flex-1 flex items-center justify-center sm:pt-5 pt-20 pb-5 border-gray-800">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 md:gap-10 max-w-6xl w-full items-center rounded-lg p-8 sm:p-8 mx-auto  ">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pr-0 md:pr-6 border border-t-2  border-b-2 border-l-0 border-r-0 py-6 pb-10 border-dashed border-[#272727] "
          >
            <h1
              className="font-chakra font-semibold text-4xl sm:text-5xl md:text-[72px] leading-[110%] tracking-[-0.02em] bg-clip-text text-transparent"
              style={{
                background:
                  "linear-gradient(94.58deg, #7B7B7B 0.8%, #EBEBEB 27.81%, #7B7B7B 44.32%, #EBEBEB 64.8%, #7B7B7B 86.02%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Invest Like the <br /> Insiders
            </h1>
            <p className="text-[#A0A0A0] text-base sm:text-lg md:text-xl mt-4 mb-6 font-chakra">
              Buy curated crates of US stocks based on real politician holdings.
            </p>

            <div className="flex flex-col sm:flex-row items-center w-full gap-3 sm:gap-0 rounded overflow-hidden mt-4">
              <input
                type="email"
                placeholder="you@example.com"
                name="email"
                value={email}
                onChange={handleEmailChange}
                required
                className="bg-[#1e1e1e] w-full sm:w-2/3 text-white placeholder-gray-500 px-4 py-3 font-chakra outline-none"
              />
              <button
                onClick={handleWaitlistSubmit}
                className="bg-white text-black w-full sm:w-auto px-6 py-3 font-medium font-ropa mt-2 sm:mt-0"
              >
                Join Waitlist
              </button>
            </div>
            {/* 
            <p className="text-xl text-white mt-3 font-chakra">
              Already have invite code?
              <span
                onClick={handleInviteCodeModalOpen}
                className="text-blue-500 mx-2 cursor-pointer"
              >
                Click here
              </span>
            </p> */}
          </motion.div>

          {/* RIGHT: Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center "
          >
            <img
              src="/assets/auth_main.svg"
              alt="crate visual"
              className="w-full max-w-xs sm:max-w-3xl md:max-w-4xl rounded-lg"
            />
          </motion.div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {isInviteCodeModalOpen && (
          <motion.div
            {...fadeInVariants}
            className="fixed inset-0 bg-[#0e0e0e] bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={handleInviteCodeModalOpen}
          >
            <motion.div
              {...modalVariants}
              className="bg-[#0e0e0e] dark:transparent backdrop-blur-lg p-4 sm:p-8 max-w-xs sm:max-w-md w-full shadow-2xl "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleInviteCodeModalClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {invitecodeModal}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isJoinSuccessModalOpen && (
          <motion.div
            {...fadeInVariants}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={handleJoinSuccessModalOpen}
          >
            <motion.div
              {...modalVariants}
              className="bg-black dark:transparent backdrop-blur-lg w-full max-w-xs sm:max-w-md flex flex-col justify-center items-center p-4 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-6 w-full">
                <button
                  onClick={handleJoinSuccessModalClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              {joinSuccessModal}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
