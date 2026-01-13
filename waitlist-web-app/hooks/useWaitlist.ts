
import { api } from "@/config";
import { toast } from "sonner";

export function useWaitlist() {
  const joinWaitlist = async ( email: string) => {
    const promise = api.post("/waitlist/join", {
      email,
    });

    toast.promise(promise, {
      loading: "Joining the waitlist...",
      success: (res) => {
        return res?.data?.message || "Successfully joined!";
      },
      error: (err) => {
        return err?.response?.data?.message || "Something went wrong";
      },
    });

    try {
      await promise;
      return true;
    } catch (err: any) {
      throw err;
    }
  };

  return { joinWaitlist };
}
