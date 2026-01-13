import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
import {
  useCreateKYCLink,
  useEnrichedUser,
  useRegisterUser,
  useTreasuryFundWallet,
} from "@/hooks/user-hooks";
import Dinari from "@dinari/api-sdk";
import { useUniversalWallet } from "@/hooks/useUniversalWallet";
import { api } from "@/config";
import toast from "react-hot-toast";

interface KycModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KycModal({ open, onOpenChange }: KycModalProps) {
  const steps = ["Register", "KYC", "Link Wallet", "Fund Wallet"];

  const [step, setStep] = useState(0);

  const { mutate: fundWallet, isPending: fundingWallet } = useTreasuryFundWallet();
  const { address, authenticated } = usePrivyAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { data: userData, refetch: refetchUser } = useEnrichedUser(
    address,
    authenticated
  );
  const { mutate: registerUser, isPending: isRegistering } = useRegisterUser();
  const { mutate: kycMutate, isPending: kycPending } = useCreateKYCLink();
  const { signMessage } = useUniversalWallet();

  const [walletLinking, setWalletLinking] = useState(false);
  const [walletLinked, setWalletLinked] = useState(false);
  const [kycLink, setKycLink] = useState("");

  const hasRegistered = !!userData?.entity_id;
  const hasStartedKYC = !!userData?.is_kyc_complete;
  const hasLinkedWallet = !!userData?.is_dinari_wallet_link || walletLinked;

  // Reset step when modal closes
  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  console.log({hasLinkedWallet, walletLinked,hasStartedKYC,step,hasRegistered,userData});
  // Auto advance steps
  useEffect(() => {
    if (step === 0 && hasRegistered) setStep(1);
    if (step === 1 && hasStartedKYC) setStep(2);
    if (step === 2 && hasLinkedWallet) setStep(3);
  }, [step, hasRegistered, hasStartedKYC, hasLinkedWallet]);

  // Register handler
  const handleRegister = useCallback(() => {
    if (!address) return toast.error("Connect your wallet first.");
    if (!name) return toast.error("Enter your full name.");
    if (!email) return toast.error("Enter your email.");
    registerUser({ wallet: address, name, email }, { onSuccess: refetchUser });
  }, [address, name, email, registerUser, refetchUser]);

  // KYC handler
  const handleKYC = async () => {
    if (!userData?.entity_id) return toast.error("Please register first.");
    kycMutate(userData.entity_id, {
      onSuccess: (data) => {
        setKycLink(data.data.kyc_res.embed_url);
        window.open(data.data.kyc_res.embed_url, "_blank");
        toast.success("KYC started! Please complete it in the new tab.");
      },
      onError: () => toast.error("Failed to start KYC. Try again."),
    });
  };

  // Wallet linking handler
  const handleLinkWallet = async () => {
    if (!userData?.dinari_account_id) return toast.error("KYC required first.");
    setWalletLinking(true);
    try {
      const client = new Dinari({
        apiKeyID: process.env.NEXT_PUBLIC_DINARI_API_KEY_ID,
        apiSecretKey: process.env.NEXT_PUBLIC_DINARI_API_SECRET_KEY,
        environment: "sandbox",
      });
      const nonceResp = await client.v2.accounts.wallet.external.getNonce(
        userData.dinari_account_id,
        {
          wallet_address: address,
          chain_id: "eip155:0",
        }
      );
      const signature = await signMessage({ message: nonceResp.message });
      
      const linkWallet = await client.v2.accounts.wallet.external.connect(
        userData.dinari_account_id,
        {
          chain_id: "eip155:0",
          nonce: nonceResp.nonce,
          signature,
          wallet_address: address,
        }
      );
      if (linkWallet.address) {
        await api.post("/user/link-wallet", { wallet: address as `0x${string}`, flag: true });
        setWalletLinked(true);
        toast.success("Wallet linked successfully!");
        refetchUser();
      } else toast.error("Wallet linking failed.");
    } finally {
      setWalletLinking(false);
    }
  };

  // Fund wallet handler
  const handleFundWallet = () => {
    if (!address) return toast.error("Wallet not connected");
    fundWallet(
      { wallet: address  as `0x${string}`},
      {
        onSuccess: () => {
          toast.success("Wallet funded successfully!");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to fund wallet"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md text-white bg-[#181818] p-0 rounded-2xl font-chakra max-h-[90vh] overflow-y-auto mx-4 my-6 sm:mx-0 sm:my-0">
        <DialogTitle>KYC Onboarding</DialogTitle>

        {/* Step Indicator */}
        <div className="flex justify-between items-center p-3 bg-[#121212]">
          <div className="text-lg font-bold">Onboarding Steps</div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-between mt-2 px-3 mb-4 text-sm text-gray-400">
          {steps.map((s, idx) => (
            <span
              key={s}
              className={`flex-1 text-center ${
                idx <= step ? "text-white font-semibold" : ""
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-3">
          {step === 0 && (
            <>
              <div className="text-lg font-semibold mb-4">Register Account</div>
              <input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
                disabled={hasRegistered}
              />
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
                disabled={hasRegistered}
              />
              <input
                value={address || ""}
                disabled
                className="w-full mb-4 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
              />
              <button
                onClick={handleRegister}
                disabled={hasRegistered || isRegistering}
                className="w-full py-3 rounded font-bold text-black mt-2"
                style={{
                  background:
                    "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                }}
              >
                {isRegistering
                  ? "Creating..."
                  : hasRegistered
                  ? "Registered ✅"
                  : "Create Entity ID"}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="text-lg font-semibold mb-4">KYC Verification</div>
              <button
                onClick={handleKYC}
                disabled={!hasRegistered || hasStartedKYC || kycPending}
                className="w-full py-3 rounded font-bold text-black mt-2"
                style={{
                  background:
                    "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                }}
              >
                {kycPending
                  ? "Loading..."
                  : hasStartedKYC
                  ? "KYC Complete ✅"
                  : "Start KYC"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-lg font-semibold mb-4">Link Wallet</div>
              <button
                onClick={handleLinkWallet}
                disabled={!hasStartedKYC || hasLinkedWallet || walletLinking}
                className="w-full py-3 rounded font-bold text-black mt-2"
                style={{
                  background:
                    "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                }}
              >
                {walletLinking
                  ? "Linking..."
                  : hasLinkedWallet
                  ? "Wallet Linked ✅"
                  : "Link to Dinari"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-lg font-semibold mb-4">Fund Your Wallet</div>
              <p className="text-sm text-gray-400 mb-4">
                Add funds to your wallet to start investing and cover future
                transactions.
              </p>
              <button
                onClick={handleFundWallet}
                disabled={fundingWallet}
                className="w-full py-3 rounded font-bold text-black mt-2"
                style={{
                  background:
                    "linear-gradient(180deg, #7B7B7B 0%, #EBEBEB 27.19%, #999999 72.17%)",
                }}
              >
                {fundingWallet ? "Funding..." : "Fund Wallet"}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
