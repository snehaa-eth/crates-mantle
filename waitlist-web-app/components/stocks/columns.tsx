"ues client";
import { ColumnDef } from "@tanstack/react-table";

interface Stock {
  _id: string;
  dinari_id: string;
  cik: string;
  composite_figi: string;
  description: string;
  display_name: string;
  name: string;
  symbol: string;
  logo_url: string;
  is_fractionable: boolean;
  is_tradable: boolean;
  tokens: string[];
  createdAt: string;
  updatedAt: string;
  price: number;
}

interface CrateStock {
  _id: string;
  weight: number;
  stock: Stock;
}


export const crateStockColumns: ColumnDef<CrateStock>[] = [
  {
    header: "Logo",
    cell: ({ row }) => (
      <img
        src={row.original.stock.logo_url}
        alt={row.original.stock.symbol}
        className="w-10 h-10 object-contain"
      />
    ),
  },
  {
    header: "Name",
    accessorFn: (row) => row.stock.name,
  },
  {
    header: "Symbol",
    accessorFn: (row) => row.stock.symbol,
  },
  {
    header: "Weight (%)",
    accessorKey: "weight",
    cell: ({ getValue }) => <span>{String(getValue())}%</span>,
  },
  {
    header: "Price ($)",
    accessorKey: "price",
 cell: ({ row }) => (
      <span>${row.original.stock.price.toFixed(2)}</span>
    ),
  },
];
