const axios = require("axios");
const JUPITER_API_BASE_URL =
  process.env.JUPITER_API_BASE_URL || "https://quote-api.jup.ag/v6";
exports.getSwapQuote = async (
  inputMint,
  outputMint,
  amount,
  slippageBps = 50
) => {
  try {
    const atomicAmount = Math.round(amount * 1_000_000_000); // USDC TO XSTOCKS
    const response = await axios.get(`${JUPITER_API_BASE_URL}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: atomicAmount,
        slippageBps,
        onlyDirectRoutes: false,
        asLegacyTransaction: true,
      },
    });

    console.log("Jupiter Swap Quote:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching swap quote from Jupiter:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch swap quote from Jupiter API");
  }
};
