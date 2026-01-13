"use client";

import { api } from "@/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useCheckWaitlist() {
  const router = useRouter();

  const checkWaitlist = async (wallet: string, inviteCode: string) => {
    try {
      const toastId = toast.loading("Verifying invite code...");
      const response = await api.get(
        `/waitlist/check?wallet=${wallet}&inviteCode=${inviteCode}`
      );
      const isVerified = response?.data?.data?.isVerified;

      if (isVerified) {
        localStorage.setItem("isVerified", "true");
        toast.dismiss(toastId);
        toast.success(response?.data?.message || "Invite code verified!");
        router.push("/launch");
      } else {
        toast.dismiss(toastId);
        toast.error("User is not verified.");
      }

      return response?.data?.data;
    } catch (err: any) {
      toast.dismiss();
      toast.error(
        err?.response?.data?.message || "Failed to verify invite code"
      );
      return null;
    }
  };

  return { checkWaitlist };
}
