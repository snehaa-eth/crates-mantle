const Transaction = require("../models/transaction.schema");
const User = require("../models/user.schema");
const Crate = require("../models/basket.schema");
const XStock = require("../models/Xstocks.schema");
const ErrorResponse = require("../utils/errorResponse");

// Create a transaction (subscribe, reinvest, buy, sell)
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      wallet,
      crateId,
      type,
      totalAmountInvested,
      transactionHash,
      orderIds,
      totalFeesDeducted,
      chainId,
      stockHoldings
    } = req.body;

    if (!wallet || !crateId || !type || !totalAmountInvested) {
      return next(new ErrorResponse("wallet, crateId, type, and totalAmountInvested are required", 400));
    }

    const user = await User.findOne({ wallet });
    const crate = await Crate.findById(crateId);
    if (!user || !crate) {
      return next(new ErrorResponse("User or crate not found", 404));
    }

    const transaction = await Transaction.create({
      userId: user._id,
      crateId: crate._id,
      type,
      totalAmountInvested,
      txHash: transactionHash,
      orderIds,
      totalFeesDeducted,
      chainId,
    });

    crate.transactions.push(transaction._id);
    user.transactions.push(transaction._id);

    // Adjust TVL and total invested
    if (type === "buy") {
      crate.tvl += Number(totalAmountInvested);
      user.totalInvested += Number(totalAmountInvested);
    } else if (type === "sell") {
      crate.tvl -= Number(totalAmountInvested);
      if (crate.tvl < 0) crate.tvl = 0;

      user.totalInvested -= Number(totalAmountInvested);
      if (user.totalInvested < 0) user.totalInvested = 0;
    }

    // Update subscribed crate holdings
    let crateHolding = user.subscribedCrates.find(c => c.crate.toString() === crateId);

    if (!crateHolding) {
      if (type === "buy") {
        crateHolding = {
          crate: crateId,
          investedAmount: Number(totalAmountInvested),
          currentValue: Number(totalAmountInvested),
          totalReturnPercent: 0,
          monthlyReturnPercent: 0,
          stockHoldings: stockHoldings || []
        };
        user.subscribedCrates.push(crateHolding);
      }
    } else {
      if (type === "buy") {
        crateHolding.investedAmount += Number(totalAmountInvested);
        crateHolding.currentValue += Number(totalAmountInvested);
      } else if (type === "sell") {
        crateHolding.investedAmount -= Number(totalAmountInvested);
        if (crateHolding.investedAmount < 0) crateHolding.investedAmount = 0;

        crateHolding.currentValue -= Number(totalAmountInvested);
        if (crateHolding.currentValue < 0) crateHolding.currentValue = 0;
      }


      if (Array.isArray(stockHoldings)) {
        stockHoldings.forEach(stockUpdate => {
          const existingStock = crateHolding.stockHoldings.find(s =>
            s.stock.toString() === stockUpdate.stock.toString()
          );

          if (existingStock) {
            if (type === "buy") {
              existingStock.sharesOwned += Number(stockUpdate.sharesOwned || 0);
            } else if (type === "sell") {
              existingStock.sharesOwned -= Number(stockUpdate.sharesOwned || 0);
              if (existingStock.sharesOwned < 0) existingStock.sharesOwned = 0;
            }
          } else {
            if (type === "buy") {
              crateHolding.stockHoldings.push(stockUpdate);
            }
          }
        });
        if (type === "sell") {
          crateHolding.stockHoldings = crateHolding.stockHoldings.filter(s => s.sharesOwned > 0);
        }
      }
    }

    await Promise.all([user.save(), crate.save()]);

    res.status(201).json({
      success: true,
      message: "Transaction & crate holdings updated successfully",
      data: transaction
    });

  } catch (error) {
    console.error("Transaction creation failed:", error);
    next(new ErrorResponse("Failed to create transaction", 500));
  }
};


// Get transactions by user
exports.getTransactionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return next(new ErrorResponse("User ID is required", 400));
    }

    // Fetch transactions for this user and also populate crate info
    const transactions = await Transaction.find({ userId })
      .populate("crateId", "name description imageUrl")
      .sort({ createdAt: -1 }); // latest first

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No transactions found for this user",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "User transactions fetched successfully",
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("getTransactionsByUser error:", error);
    next(new ErrorResponse("Failed to fetch user transactions", 500));
  }
};

// Get transactions by crate
exports.getTransactionsByCrate = async (req, res, next) => {
  try {
    const { crateId } = req.params;
    const transactions = await Transaction.find({ crate: crateId }).populate("user stock");
    res.status(200).json({
      success: true,
      message: "Crate transactions fetched successfully",
      data: transactions
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch crate transactions", 500));
  }
};

// Get transaction details by ID
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id).populate("user crate stock");
    if (!transaction) {
      return next(new ErrorResponse("Transaction not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Transaction details fetched successfully",
      data: transaction
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch transaction details", 500));
  }
};

// Get fee quote for sell order
exports.getFeeQuote = async (req, res, next) => {
  try {
    const { accountId, order } = req.body;

    console.log("Fee quote request received:");
    console.log("accountId:", accountId);
    console.log("order:", JSON.stringify(order, null, 2));

    if (!accountId || !order) {
      return next(new ErrorResponse("accountId and order are required", 400));
    }

    const Dinari = require("@dinari/api-sdk");
    const client = new Dinari({
      apiKeyID: process.env.DINARI_API_KEY_ID,
      apiSecretKey: process.env.DINARI_API_SECRET_KEY,
      environment: "sandbox",
    });

    console.log("Calling Dinari API with:");
    console.log("accountId:", accountId);
    console.log("order object:", order);


    // Try orderRequests.getFeeQuote instead of the eip155 endpoint
    const feeQuoteResponse =
    await client.v2.accounts.orderRequests.getFeeQuote(
      accountId,
     {
       order_side: order.order_side,
       order_type: order.order_type,
       stock_id: order.stock_id,
       asset_token_quantity: order.asset_token_quantity,
       payment_token_quantity: order.payment_token_quantity,
       chain_id: order.chain_id,
     }
    );
  

    res.status(200).json({
      success: true,
      data: feeQuoteResponse,
    });
  } catch (error) {
    console.error("Fee quote error:", error.message || error);
    console.error("Full error:", error);
    return next(new ErrorResponse(`Failed to get fee quote: ${error.message || 'Unknown error'}`, 500));
  }
};
