"use client"
import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { ChevronDown, Search, Bug } from 'lucide-react';
import Image from 'next/image';
import { useEnrichedUser } from '../../hooks/user-hooks';
import { usePrivyAuth } from '../../context/PrivyAuthContext';
import OrderRow from '@/components/OrderRow';

const transactionTypeOptions = [
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
];

const crateTypeOptions = [
  { label: 'All', value: 'all' },
  { label: 'AI', value: 'ai' },
  { label: 'Politician', value: 'politician' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Military', value: 'military' },
  { label: 'Others', value: 'others' },
];

const Page = () => {
  const [latestFirst, setLatestFirst] = useState(false);
  const [search, setSearch] = useState('');
  const [transactionType, setTransactionType] = useState<string>('');
  const [crateType, setCrateType] = useState<string>('');
  const { address, authenticated } = usePrivyAuth();
  const { data: userData, isLoading } = useEnrichedUser(address, authenticated);

  const ordersData = userData?.transactions || [];

  // pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredOrders = useMemo(() => {
    let result = [...ordersData];

    if (transactionType) {
      result = result.filter(order => order.type?.toLowerCase() === transactionType.toLowerCase());
    }
    if (crateType && crateType !== 'all') {
      result = result.filter(order => order.crateType?.toLowerCase() === crateType.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(order =>
        order.symbol?.toLowerCase().includes(q) ||
        order.creator?.toLowerCase().includes(q) ||
        order.txHash?.toLowerCase().includes(q)
      );
    }
    if (latestFirst) {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [ordersData, transactionType, crateType, search, latestFirst]);

  // pagination logic
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const hasTransactions = filteredOrders.length > 0;

  return (
    <div className="min-h-screen pt-24 max-w-6xl w-full mx-auto text-white">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      {!address ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Bug className="w-16 h-16 text-gray-400 mb-4" />
          <div className="text-2xl font-chakra text-center">Connect your wallet</div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-2xl font-chakra text-center">Loading transactions...</div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            {/* Transaction Type Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 bg-[#232323] border-none text-white font-chakra justify-between flex items-center"
                  type="button"
                >
                  <span>{transactionType ? transactionTypeOptions.find(o => o.value === transactionType)?.label : 'Transaction type'}</span>
                  <ChevronDown className="ml-2 w-4 h-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#232323] mt-2 text-white font-chakra w-44 p-2">
                {transactionTypeOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-[#181818] ${transactionType === opt.value ? 'bg-[#181818]' : ''}`}
                    onClick={() => setTransactionType(opt.value)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Crate Type Dropdown */}
            <Popover>
              <PopoverContent className="bg-[#232323] mt-2 text-white font-chakra w-44 p-2">
                {crateTypeOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-[#181818] ${crateType === opt.value ? 'bg-[#181818]' : ''}`}
                    onClick={() => setCrateType(opt.value)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Latest Orders toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm">Latest Orders First</span>
              <input
                type="checkbox"
                checked={latestFirst}
                onChange={() => setLatestFirst(!latestFirst)}
                className="accent-green-500"
              />
            </label>

            <div className="flex-1" />
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727272] w-4 h-4 pointer-events-none" />
              <Input
                className="bg-[#181818] border-none text-white font-chakra placeholder:text-[#727272] h-12 pl-10"
                placeholder="Search crates, creators and..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {hasTransactions ? (
            <div className="overflow-x-auto rounded-xl border border-[#2A2A2A] shadow-lg">
              <table className="min-w-full text-xs md:text-sm font-chakra table-auto">
                <thead className="bg-[#1E1E1E] text-[#A1A1A1] uppercase text-[10px] md:text-xs">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left">Date</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left">Type</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left">Tx Hash</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left">Amount</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left">Status</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left hidden md:table-cell">Percentage Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {paginatedOrders.map((order: any, i: number) => (
                    <OrderRow key={order._id || i} order={order} />
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center px-4 py-3 bg-[#1E1E1E] border-t border-[#2A2A2A]">
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="bg-[#232323] border-none text-white"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    className="bg-[#232323] border-none text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Image src="/assets/txn.svg" alt="No transactions" width={220} height={120} />
              <div className="mt-8 text-xl font-chakra text-gray-300">
                No transactions yet.
                <br />
                Start by buying your first crate!
              </div>
              <a href="/discover" className="mt-8">
                <button className="border border-[#444] rounded-lg px-6 py-3 text-white font-chakra text-lg hover:bg-[#181818] transition">
                  Discover More Crates
                </button>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Page;
