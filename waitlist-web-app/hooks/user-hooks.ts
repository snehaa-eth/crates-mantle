import { EnrichedUser, RegisterUserInput } from "@/lib/interfaces";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config";
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
type SubscribeCrateParams = {
    wallet: string;
    crateId: string;
};
export function useHasMounted() {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    return hasMounted;
}
const createKYCLink = async (entity_id: string) => {
    try {
        const res = await api.get(`/user/kyc/${entity_id}`);

        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch user");
        }
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
};

const getMockUsdc = async (wallet: `0x${string}`, chain_id: number) => {
    try {
        const res = await api.post(`/user/fund-wallet`, {
            wallet, chain_id
        });

        console.log(res)

        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch user");
        }
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
}

const getTreasuryFundWallet = async (wallet: `0x${string}`) => {
    try {
        const res = await api.post(`/user/fund-wallet-from-treasury`, {
            wallet, 
        });

        console.log(res)

        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fund wallet from treasury");
        }
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
}

const fetchUserByWallet = async (wallet: string): Promise<EnrichedUser> => {
    try {
        const res = await api.get(`/user/${wallet}`);
        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch user");
        }
        return res.data.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
};
const registerUser = async (input: RegisterUserInput) => {
    const res = await api.post('/user/register', input);
    return res.data;
};

const fetchAllCrates = async () => {
    try {
        const res = await api.get('/crates');
        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch crates");
        }
        return res.data.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
}

const getCrateById = async (crateId: string) => {
    try {
        const res = await api.get(`/crates/${crateId}`);
        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch crate");
        }
        return res.data.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
}

export const useRegisterUser = () => {
    return useMutation({
        mutationFn: registerUser,
    });
};
export const useEnrichedUser = (wallet: string, enabled: boolean) => {
    return useQuery<EnrichedUser | null>({
        queryKey: ["user", wallet],
        queryFn: () => fetchUserByWallet(wallet),
        enabled: enabled && !!wallet,
        retry: false, // prevent auto retries for "User not found"
    });
};

export const useCreateKYCLink = () => {
    return useMutation({
        mutationFn: (entity_id: string) => createKYCLink(entity_id),
    });
};

export const useGetAllCrates = () => {
    return useQuery({
        queryKey: ["crates"],
        queryFn: fetchAllCrates,
        retry: false, // prevent auto retries for "User not found"
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export const useGetCrateById = (crateId: string) => {
    return useQuery({
        queryKey: ["crate", crateId],
        queryFn: () => getCrateById(crateId),
        enabled: !!crateId,
        retry: false, // prevent auto retries for "User not found"
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}

export const useSubscribeCrate = () => {
    return useMutation({
        mutationFn: async ({ wallet, crateId }: SubscribeCrateParams) => {
            let id = toast.loading("Subscribing to crate...");
            try {
                //todo if not free take money in admin wallet
                const response = await api.post(`/user/${wallet}/subscribe`, {
                    crateId,
                });
                toast.success(response.data.message, {
                    id,
                });
                return response.data;
            } catch (error) {
                toast.error("Failed to subscribe to crate", {
                    id,
                });
            }
        },
    });
};

const fetchUserPortfolio = async (wallet: string) => {
    try {
        const res = await api.get(`/user/${wallet}/dinari-portfolio`);
        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch user portfolio");
        }
        return res.data.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
};

const fetchUserTransactions = async (userId: string) => {
    try {
        const res = await api.get(`/transactions/user/${userId}`);
        console.log(res)
        if (!res.data.success) {
            throw new Error(res.data.message || "Failed to fetch user orders");
        }
        return res.data.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message || "Unknown error");
    }
};

export const useUserPortfolio = (wallet: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["user-portfolio", wallet],
        queryFn: () => fetchUserPortfolio(wallet),
        enabled: enabled && !!wallet,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useUserOrders = (userId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["user-orders", userId],
        queryFn: () => fetchUserTransactions(userId),
        enabled: enabled && !!userId,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export function useFundWallet() {
    return useMutation({
        mutationFn: ({ wallet, chain_id }: { wallet: `0x${string}`; chain_id: number }) =>
            getMockUsdc(wallet, chain_id),
        onSuccess: () => {
            toast.success("✅ Wallet funded successfully!")
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.message}`)
        },
    })
}

export function useTreasuryFundWallet() {
    return useMutation({
        mutationFn: ({ wallet }: { wallet: `0x${string}`;}) =>
            getTreasuryFundWallet(wallet),
        onSuccess: () => {
            toast.success("✅ Wallet funded from treasury successfully!")
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.message}`)
        },
    })
}