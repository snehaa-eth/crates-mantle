require("dotenv").config();
const Dinari = require("@dinari/api-sdk").default;
const getDinariStocks = async () => {
  try {
    const client = new Dinari({
      apiKeyID: process.env.DINARI_API_KEY_ID || "your_api_key_id",
      apiSecretKey: process.env.DINARI_API_SECRET_KEY || "your_secret_key",
      environment: "sandbox", // or 'production'
    });

    const allStocks = [];
    const pageSize = 25;
    const totalPages = 6; // As per your note

    for (let page = 1; page <= totalPages; page++) {
      const stocksPage = await client.v2.marketData.stocks.list({
        page,
        pageSize,
      });

      console.log(`📄 Page ${page} fetched with ${stocksPage.length} stocks`);
      allStocks.push(...stocksPage);
    }

    console.log(`✅ Total stocks fetched: ${allStocks.length}`);
    return allStocks;

  } catch (error) {
    console.error("❌ Dinari SDK error:", error.message);
    throw new Error("Failed to fetch Dinari stocks");
  }
};

// Run the function if executed directly
getDinariStocks();
