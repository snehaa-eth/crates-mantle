"use client";
import { useCallback, useState } from "react";
import { usePrivyAuth } from "@/context/PrivyAuthContext";
import { useCreateKYCLink, useEnrichedUser, useHasMounted, useRegisterUser } from "@/hooks/user-hooks";
import Dinari from "@dinari/api-sdk";
import { useUniversalWallet } from "@/hooks/useUniversalWallet";
import { api } from "@/config";

export default function OnboardingPage() {
    const { signMessage } = useUniversalWallet();
    const { address, authenticated } = usePrivyAuth();
    const hasMounted = useHasMounted();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const { data: userData, isLoading } = useEnrichedUser(address, authenticated);
    const { mutate, isPending, isSuccess } = useRegisterUser();
    const {
        mutate: kycMutate,
        isPending: kycPending,
        isSuccess: kycSuccess,
        isError,
        error: kycError,
        data: kycData,
    } = useCreateKYCLink();

    const hasRegistered = !!userData?.entity_id;
    const hasStartedKYC = !!userData?.is_kyc_complete;
    const hasLinkedWallet = !!userData?.is_dinari_wallet_link;

    const handleClick = (entityId: string) => {
        kycMutate(entityId);
        if (kycPending) return alert("KYC link is being created, please wait...");
        if (isError) return alert(`Error creating KYC link: ${kycError.message}`);
        if (kycSuccess && kycData?.kyc_res.embed_url) {
            window.open(kycData.kyc_res.embed_url, "_blank");
        } else {
            alert("KYC link created, but no embed URL found.");
        }
    };

    const handleLinkWallet = async () => {
        const client = new Dinari({
            apiKeyID: process.env.NEXT_PUBLIC_DINARI_API_KEY_ID,
            apiSecretKey: process.env.NEXT_PUBLIC_DINARI_API_SECRET_KEY,
            environment: "sandbox",
        });

        if (!userData?.dinari_account_id) return alert("Please create an Entity ID first.");

        const nonceResp = await client.v2.accounts.wallet.external.getNonce(userData?.dinari_account_id, {
            wallet_address: address,
            chain_id: "eip155:0",
        });

        const signature = await signMessage({ message: nonceResp.message });

        const linkWallet = await client.v2.accounts.wallet.external.connect(userData?.dinari_account_id, {
            chain_id: "eip155:0",
            nonce: nonceResp.nonce,
            signature,
            wallet_address: address,
        });

        if (linkWallet.address) {
            const res = await api.post('/user/link-wallet', {
                wallet: address,
                flag: true
            });
            if (res.data.success) {
                alert("Wallet linked successfully!");
            } else {
                alert(`Failed to link wallet: ${res.data.message}`);
            }
        } else {
            alert("Failed to link wallet. Please try again.");
        }
    };

    const handleRegister = useCallback(() => {
        if (!address) return alert("Please connect your wallet.");
        if (!email) return alert("Please add your email.");
        if (!name) return alert("Please enter your name.");
        mutate({ wallet: address, name, email });
    }, [mutate, address, email, name]);

    if (!hasMounted) return null;

    if (!authenticated) {
        return (
            <div className="flex items-center justify-center h-screen">
                <h1 className="text-2xl font-bold">Please connect your wallet to continue.</h1>
            </div>
        );
    }

    const stepDoneStyle = "bg-green-500";
    const stepPendingStyle = "bg-green-400";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-[#0f0f0f] text-white">
            <h1 className="text-3xl md:text-4xl font-bold mt-24 mb-10">
                {hasRegistered && hasStartedKYC && hasLinkedWallet ? "✅ Onboarding Complete" : "Complete Onboarding"}
            </h1>

            <div className="flex flex-col md:flex-row items-start justify-center gap-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center w-full max-w-sm opacity-100">
                    <div className={`w-10 h-10 ${hasRegistered ? stepDoneStyle : stepPendingStyle} rounded-full flex items-center justify-center font-bold text-black`}>
                        1
                    </div>
                    <div className="mt-4 p-6 border border-gray-600 rounded-lg w-full bg-[#1a1a1a] shadow-md">
                        <h2 className="text-lg font-semibold mb-4">Register</h2>
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full mb-3 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={hasRegistered}
                        />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full mb-3 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={hasRegistered}
                        />
                        <input
                            type="text"
                            placeholder="Wallet Address"
                            className="w-full mb-4 px-3 py-2 rounded bg-[#2a2a2a] border border-gray-500 text-white"
                            value={address || ""}
                            disabled
                        />
                        <button
                            className="w-full bg-green-500 text-black font-semibold py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
                            onClick={handleRegister}
                            disabled={hasRegistered}
                        >
                            {isPending ? "Creating..." : hasRegistered ? "Registered" : "Create Entity ID"}
                        </button>
                    </div>
                </div>

                {/* Step 2 */}
                <div className={`flex flex-col items-center w-full max-w-sm ${hasRegistered ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                    <div className={`w-10 h-10 ${hasStartedKYC ? stepDoneStyle : stepPendingStyle} rounded-full flex items-center justify-center font-bold text-black`}>
                        2
                    </div>
                    <div className="mt-4 p-6 border border-gray-600 rounded-lg w-full bg-[#1a1a1a] shadow-md flex flex-col justify-center items-center gap-4 min-h-[200px]">
                        <h2 className="text-lg font-semibold">KYC Verification</h2>
                        <button
                            onClick={() => userData?.entity_id && handleClick(userData.entity_id)}
                            className="bg-green-500 text-black font-semibold py-2 px-4 rounded hover:bg-green-600 transition"
                            disabled={!hasRegistered || hasStartedKYC}
                        >
                            {kycPending ? "Loading..." : hasStartedKYC ? "KYC Complete" : "Start KYC"}
                        </button>
                        {hasStartedKYC && kycData?.kyc_res?.embed_url && (
                            <a
                                href={kycData.kyc_res.embed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline text-sm"
                            >
                                View KYC Portal
                            </a>
                        )}
                    </div>
                </div>

                {/* Step 3 */}
                <div className={`flex flex-col items-center w-full max-w-sm ${hasStartedKYC ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                    <div className={`w-10 h-10 ${hasLinkedWallet ? stepDoneStyle : stepPendingStyle} rounded-full flex items-center justify-center font-bold text-black`}>
                        3
                    </div>
                    <div className="mt-4 p-6 border border-gray-600 rounded-lg w-full bg-[#1a1a1a] shadow-md flex flex-col justify-center items-center gap-4 min-h-[160px]">
                        <h2 className="text-lg font-semibold">Link Wallet</h2>
                        <button
                            onClick={handleLinkWallet}
                            className="bg-green-500 text-black font-semibold py-2 px-4 rounded hover:bg-green-600 transition"
                            disabled={!hasStartedKYC || hasLinkedWallet}
                        >
                            {hasLinkedWallet ? "Wallet Linked" : "Link to Dinari"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Debug user info */}
            {userData?.wallet && (
                <pre className="mt-10 w-full max-w-4xl bg-black/40 p-4 rounded text-sm overflow-x-auto border border-white/10">
                    {JSON.stringify(userData, null, 2)}
                </pre>
            )}
        </div>
    );
}
