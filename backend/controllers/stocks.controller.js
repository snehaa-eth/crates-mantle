const XStock = require("../models/Xstocks.schema");
const ErrorResponse = require("../utils/errorResponse");
const client = require("../utils/client");

exports.getAllStocks = async (req, res, next) => {
  try {
    const stocks = await XStock.find();
    return res.status(200).json({
      success: true,
      message: "Stocks fetched successfully",
      data: stocks,
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return next(new ErrorResponse("Failed to fetch stocks", 500));
  }
};

exports.getStockPrices = async (req, res, next) => {
  const { stockIDs } = req.body;

  if (!Array.isArray(stockIDs) || stockIDs.length === 0) {
    return next(new ErrorResponse("Required an array of stock IDs", 400));
  }

  try {
  
    const results = await Promise.all(
      stockIDs.map(async (stockID) => {
        try {
          const quote = await client.v2.marketData.stocks.retrieveCurrentQuote(stockID);
          const currentPrice = await client.v2.marketData.stocks.retrieveCurrentPrice(stockID);
          return {
            stockID,
            success: true,
            quote,
            currentPrice,
          };
        } catch (error) {
          return {
            stockID,
            success: false,
            error: error.message || "Failed to fetch data",
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Stock prices fetched successfully",
      data: results,
    });

  } catch (error) {
    return next(new ErrorResponse("Internal server error", 500));
  }
};

exports.registerXStocks = async (req, res, next) => {
  try {
    const { stocks } = req.body;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return next(new ErrorResponse("Request body must be a non-empty array of stocks", 400));
    }

    // Transform each stock into schema format
    const formattedStocks = stocks
      .filter((s) => s?.id) // ensure 'id' exists to map as dinari_id
      .map((stock) => ({
        dinari_id: stock.id,
        cik: stock.cik,
        composite_figi: stock.composite_figi,
        cusip: stock.cusip,
        description: stock.description,
        display_name: stock.display_name,
        name: stock.name,
        symbol: stock.symbol,
        logo_url: stock.logo_url,
        is_fractionable: stock.is_fractionable,
        is_tradable: stock.is_tradable,
        tokens: Array.isArray(stock.tokens) ? stock.tokens : [],
      }));

    if (formattedStocks.length === 0) {
      return next(new ErrorResponse("No valid stock data to insert", 400));
    }

    const insertedStocks = await XStock.insertMany(formattedStocks, {
      ordered: false,
    });

    console.log("✅ Inserted count:", insertedStocks.length);

    return res.status(201).json({
      success: true,
      message: "Stocks registered successfully",
      data: insertedStocks,
    });
  } catch (error) {
    console.error("❌ Error registering stocks:", error);

    if (error.name === "BulkWriteError") {
      return next(new ErrorResponse("Some stocks were duplicates and not inserted", 409));
    }

    return next(new ErrorResponse("Failed to register stocks", 500));
  }
};

exports.getFeeDinari = async (req, res, next) => {
  const {feeQuoteData} = req.body;
  try {
    let feeData = await 
    console.log(data);

    return res.status(200).json({
      success: true,
      message: "Fee data fetched successfully",
      data: { quote: data, currentPrice }
    });
  } catch (error) {
    return next(new ErrorResponse("Failed to fetch fee data", 500));
  }
};

exports.updateStockPrices = async (req, res, next) => {
  try {
    const stocks = await XStock.find({});
    if (!stocks.length) {
      return next(new ErrorResponse("No stocks found in database", 404));
    }
    const updatedStocks = await Promise.all(
      stocks.map(async (stock) => {
        try {
          const currentPriceData = await client.v2.marketData.stocks.retrieveCurrentPrice(stock.dinari_id);
          const price = currentPriceData?.price ?? null;
          stock.price = price;
          await stock.save();
          return stock;
        } catch (err) {
          console.error(`❌ Failed to update price for ${stock.symbol}`, err.message);
          return stock; // Keep stock without price update
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Stock prices updated successfully",
      data: { updatedStocks, count: updatedStocks.length },
    });

  } catch (error) {
    console.error("❌ Error updating stock prices:", error);
    return next(new ErrorResponse("Failed to update stock prices", 500));
  }
};
