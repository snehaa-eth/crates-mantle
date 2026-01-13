"use client";
import { crateStockColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";

export function StocksTable({stocks}) {
  return (
    <div className="mt-8 font-chakra bg-[#0e0e0e]">
      <DataTable columns={crateStockColumns} data={stocks} />
    </div>
  );
}
