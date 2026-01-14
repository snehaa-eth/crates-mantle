import { api } from "@/config";

interface FeeQuoteRequest {
  accountId: string;
  order: any;
}

export const getFeeQuote = async ({ accountId, order }: FeeQuoteRequest) => {
  try {
    const response = await api.post('/transactions/fee-quote', {
      accountId,
      order,
    });

    return response.data.data;
  } catch (error) {
    console.error('Fee quote error:', error);
    throw error;
  }
};
