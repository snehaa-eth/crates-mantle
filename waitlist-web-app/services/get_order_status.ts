import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { toast } from "sonner";
import orderProcessorData from "@/lib/sbt-deployments/v0.4.0/order_processor.json";

export function useGetOrderStatus(orderIds?: string[]) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["orderStatus", address, orderIds],
    enabled: !!address && !!publicClient && !!orderIds && orderIds.length > 0,
    queryFn: async () => {
      if (!address || !publicClient) {
        throw new Error("Wallet not connected");
      }

      try {
        const chainId = publicClient.chain.id;
        const orderProcessorAbi = orderProcessorData.abi;
        const orderProcessorAddress = (orderProcessorData.networkAddresses as Record<
          string,
          string
        >)[String(chainId)] as `0x${string}`;

        if (!orderProcessorAddress) {
          throw new Error(`No contract deployed for chainId ${chainId}`);
        }

        // Read statuses
        const statuses = await Promise.all(
          orderIds!.map(async (orderId) => {
            const status = await publicClient.readContract({
              address: orderProcessorAddress,
              abi: orderProcessorAbi,
              functionName: "getOrderStatus",
              args: [BigInt(orderId)], // ✅ ensure correct type
            });
            return Number(status); // 1 = not completed, 2 = completed
          })
        );
        
       
        const completedCount = statuses.filter((s) => s === 2).length;
        const percentageCompleted =
          orderIds!.length > 0
            ? (completedCount / orderIds!.length) * 100
            : 0;

      

        return {
          statuses, // array of raw codes
          completedCount,
          total: orderIds!.length,
          percentageCompleted,
        };
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch order status");
        throw err;
      }
    },
  });
}
