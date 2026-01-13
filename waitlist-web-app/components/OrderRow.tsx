import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useGetOrderStatus } from "@/services/get_order_status";
import { useUniversalWallet } from "@/hooks/useUniversalWallet";

export default function OrderRow({ order }: { order: any }) {
  const { address } = useUniversalWallet();
  const { data: statusInfo, isLoading: statusLoading } = useGetOrderStatus(order?.orderIds);
  // Format date
  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const txHash = order.txHash || "";
  const shortTxHash = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : "";

  const amount = order.totalAmountInvested || 0;
  const formattedAmount = `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <tr className="hover:bg-[#121212] transition-colors">
      <td className="px-3 md:px-4 py-2 md:py-3 text-[#A1A1A1] text-xs md:text-sm align-middle leading-tight">{orderDate}</td>
      <td className="px-3 md:px-4 py-2 md:py-3 align-middle">
        <span
          className={`px-2 py-1 rounded-md text-xs font-medium ${order.type === "buy"
              ? "bg-green-900/40 text-green-400"
              : "bg-red-900/40 text-red-400"
            }`}
        >
          {order.type.toUpperCase()}
        </span>
      </td>

      <td className="px-3 md:px-4 py-2 md:py-3 align-middle">
        <div className="flex items-center gap-2">
        <span className="text-blue-400">{shortTxHash}</span>
        {txHash && (
          <button
            className="hover:text-blue-500 transition-colors"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(txHash);
                toast.success("Tx hash copied!");
              } catch (err) {
                toast.error("Failed to copy tx hash.");
              }
            }}
            title="Copy full hash"
          >
            <Image src="/assets/copy.svg" alt="Copy" width={16} height={16} />
          </button>
        )}
        </div>
      </td>

      <td
        className={`px-3 md:px-4 py-2 md:py-3 align-middle font-medium ${order.type === "buy" ? "text-green-400" : "text-red-400"
          }`}
      >
        {formattedAmount}
      </td>

      <td className="px-3 md:px-4 py-2 md:py-3 align-middle">
        {statusLoading ? (
          <span className="text-yellow-400">Loading...</span>
        ) : statusInfo ? (
          <span
            className={`px-2 py-1 rounded-md text-xs ${statusInfo.completedCount === statusInfo.total
                ? "bg-green-900/40 text-green-400"
                : "bg-yellow-900/40 text-yellow-400"
              }`}
          >
            {statusInfo.completedCount === statusInfo.total
              ? "COMPLETED"
              : "PENDING"}
          </span>
        ) : (
          <span className="text-gray-400">No Data</span>
        )}
      </td>

      <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell align-middle">
        {statusLoading ? (
          <span className="text-yellow-400">Loading...</span>
        ) : statusInfo ? (
          <span className="text-green-400">
            {statusInfo.completedCount}/{statusInfo.total} completed (
            {statusInfo.percentageCompleted.toFixed(0)}%)
          </span>
        ) : (
          <span className="text-gray-400">No Data</span>
        )}
      </td>
    </tr>
  );
}
