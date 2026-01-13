const User = require("../models/user.schema");
const Crate = require("../models/basket.schema");
const Transaction = require("../models/transaction.schema");
const ErrorResponse = require("../utils/errorResponse");
const client = require("../utils/client");
const { Wallet } = require("ethers");
const { syncUserWithDinari } = require("../services/userSyncServiceDinari");

exports.registerUser = async (req, res, next) => {
  try {
    const { wallet, name, email } = req.body;
    console.log(wallet, name, email, "email");
    if (!wallet) {
      return next(new ErrorResponse("Wallet address is required", 400));
    }
    let user = await User.findOne({ wallet });
    if (user) {
      let entity_id = user.entity_id;
      let result = await client.v2.entities.retrieveByID(entity_id);
      return res.status(200).json({
        success: true,
        message: "User already exists",
        data: { user, result },
      });
    }
    // Create user in your DB first
    user = await User.create({ wallet, name, email });
    // Then call Dinari to create entity
    const dinari_res = await client.v2.entities.create({
      name,
      reference_id: user._id.toString(),
    });
    user.entity_id = dinari_res.id;
    user.nationality = dinari_res.nationality || null;
    user.is_kyc_complete = dinari_res.is_kyc_complete || false;
    await user.save();
    res.status(201).json({
      success: true,
      message: "User registered and Dinari entity created",
      data: { user, dinari_res },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(new ErrorResponse("Failed to register user", 500));
  }
};

exports.getUserByWallet = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    if (!wallet) {
      return next(new ErrorResponse("Wallet address is required", 400));
    }

    const user = await User.findOne({ wallet })
      .populate({
        path: "subscribedCrates.crate",
        populate: { path: "stocks.stock" },
      })
      .populate("subscribedCrates.stockHoldings.stock")
      .populate("transactions");

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    } else {
      await syncUserWithDinari(user, client);
    }

    const uniqueStockIds = new Set();
    user.subscribedCrates?.forEach((crateHolding) => {
      crateHolding.stockHoldings.forEach((holding) => {
        if (holding.stock) {
          uniqueStockIds.add(holding.stock.toString());
        }
      });
    });

    const enrichedUser = {
      wallet: user.wallet,
      email: user.email,
      name: user.name,
      dinari_account_id: user.dinari_account_id,
      is_kyc_complete: user.is_kyc_complete,
      nationality: user.nationality,
      phoneNumber: user.phoneNumber,
      entity_id: user.entity_id,
      is_dinari_wallet_link: user.is_dinari_wallet_link,
      kyc: user.kyc,
      currentValidateAccounts: user.currentValidateAccounts,
      totalInvested: user.totalInvested,
      totalReturnPercent: user.totalReturnPercent,
      totalUniqueStocks: uniqueStockIds.size,
      totalInvestedCrates: user.subscribedCrates.length,
      transactions: user.transactions,
      subscribedCrates: user.subscribedCrates.map((crateHolding) => {
        const crate = crateHolding.crate;
        return {
          crateId: crate._id,
          name: crate.name,
          description: crate.description,
          imageUrl: crate.imageUrl,
          subscriptionAmount: crate.subscriptionAmount,
          subscriptionPeriod: crate.subscriptionPeriod,
          rebalanceFrequency: crate.rebalanceFrequency,
          riskPercent: crate.riskPercent,
          totalReturnPercent: crate.totalReturnPercent,
          monthlyReturnPercent: crate.monthlyReturnPercent,
          activeSubscribers: crate.activeSubscribers,
          createProgramAddressSync: crate.createProgramAddressSync,
          stocks: crate.stocks.map((s) => ({
            stockId: s.stock._id,
            symbol: s.stock.symbol,
            name: s.stock.name,
            weight: s.weight,
            price: s.price,
          })),
          userInvestment: {
            investedAmount: crateHolding.investedAmount,
            currentValue: crateHolding.currentValue,
            totalReturnPercent: crateHolding.totalReturnPercent,
            monthlyReturnPercent: crateHolding.monthlyReturnPercent,
            stockHoldings: crateHolding.stockHoldings.map((sh) => ({
              stockId: sh.stock,
              sharesOwned: sh.sharesOwned,

            })),
          },
        };
      }),
    };

    res.status(200).json({
      success: true,
      message: "User data retrieved successfully",
      data: enrichedUser,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to fetch user", 500));
  }
};

exports.subscribeCrate = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const { crateId } = req.body;
    if (!wallet || !crateId) {
      return next(new ErrorResponse("Wallet and crateId are required", 400));
    }
    const user = await User.findOne({ wallet });
    const crate = await Crate.findById(crateId);
    if (!user || !crate) {
      return next(new ErrorResponse("User or crate not found", 404));
    }
    const alreadySubscribed = user.subscribedCrates.some(
      (h) => h.crate.toString() === crateId
    );
    if (alreadySubscribed) {
      return res.status(200).json({
        success: true,
        message: "Already subscribed to this crate",
        data: user,
      });
    }
    user.subscribedCrates.push({ crate: crateId });
    user.totalInvestedCrates = user.subscribedCrates.length;
    await user.save();
    crate.activeSubscribers += 1;
    await crate.save();
    res.status(200).json({
      success: true,
      message: "Successfully subscribed to the crate (access granted)",
      data: user,
    });
  } catch (error) {
    next(new ErrorResponse("Failed to subscribe to crate", 500));
  }
};

// Reinvest in a crate
exports.reinvestInCrate = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const { crateId, amountUSD, txHash } = req.body;
    if (!wallet || !crateId || !amountUSD) {
      return next(
        new ErrorResponse("Wallet, crateId, and amountUSD are required", 400)
      );
    }
    const user = await User.findOne({ wallet });
    const crate = await Crate.findById(crateId);
    if (!user || !crate) {
      return next(new ErrorResponse("User or crate not found", 404));
    }
    // Find holding
    const holding = user.subscribedCrates.find(
      (h) => h.crate.toString() === crateId
    );
    if (!holding) {
      return next(
        new ErrorResponse("User is not subscribed to this crate", 400)
      );
    }
    holding.investedAmount += amountUSD;
    user.totalInvested += amountUSD;
    await user.save();
    // Log transaction
    const transaction = await Transaction.create({
      user: user._id,
      crate: crate._id,
      type: "reinvest",
      amountUSD,
      transactionHash: txHash,
      status: "completed",
    });
    user.transactions.push(transaction._id);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Successfully reinvested in the crate",
      data: { user, transaction },
    });
  } catch (error) {
    next(new ErrorResponse("Failed to reinvest in crate", 500));
  }
};

// Get user portfolio stats (total invested, unique stocks, returns, etc.)
exports.getUserPortfolioStats = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet }).populate({
      path: "subscribedCrates.crate",
      populate: { path: "stocks.stock" },
    });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    // Aggregate unique stocks
    const uniqueStockIds = new Set();
    let totalReturn = 0;
    user.subscribedCrates.forEach((h) => {
      if (h.crate && h.crate.stocks) {
        h.crate.stocks.forEach((s) =>
          uniqueStockIds.add(s.stock._id.toString())
        );
      }
      totalReturn += h.totalReturnPercent || 0;
    });
    user.totalUniqueStocks = uniqueStockIds.size;
    user.totalReturnPercent = totalReturn;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Portfolio stats retrieved successfully",
      data: {
        totalInvested: user.totalInvested,
        totalInvestedCrates: user.totalInvestedCrates,
        totalUniqueStocks: user.totalUniqueStocks,
        totalReturnPercent: user.totalReturnPercent,
      },
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch user portfolio stats", 500));
  }
};

//get subscribed crates
exports.getUserPortfolioStocks = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet }).populate({
      path: "subscribedCrates.crate",
      populate: { path: "stocks.stock" },
    });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    // Aggregate all stocks with per-stock stats
    const stockMap = {};
    user.subscribedCrates.forEach((h) => {
      if (h.stockHoldings) {
        h.stockHoldings.forEach((sh) => {
          const id = sh.stock.toString();
          if (!stockMap[id]) {
            stockMap[id] = { ...sh };
          } else {
            stockMap[id].userHoldingUSD += sh.userHoldingUSD || 0;
            stockMap[id].sharesOwned += sh.sharesOwned || 0;
            stockMap[id].netGain += sh.netGain || 0;
          }
        });
      }
    });
    res.status(200).json({
      success: true,
      message: "Portfolio stocks retrieved successfully",
      data: Object.values(stockMap),
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch user portfolio stocks", 500));
  }
};

exports.createKYCLink = async (req, res, next) => {
  try {
    const { entity_id } = req.params;
    if (!entity_id) {
      return next(new ErrorResponse("Entity Id is required", 400));
    }
    let kyc_res = await client.v2.entities.kyc.createManagedCheck(entity_id);
    console.log(kyc_res);
    res.status(201).json({
      success: true,
      message: "KYC link created successfully",
      data: { kyc_res },
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(new ErrorResponse("Failed to create KYC link", 500));
  }
};

exports.linkYourWallet = async (req, res, next) => {
  try {
    const { wallet, flag } = req.body;
    let user = await User.findOne({ wallet });
    if (!user) {
      return next(new ErrorResponse("User does not exist", 404));
    }
    if (flag) {
      user.is_dinari_wallet_link = true;
    }
    await user.save();
    res.status(201).json({
      success: true,
      message: "Wallet linked successfully",
      data: user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(new ErrorResponse(error.message, 500));
  }
};

exports.fundAccountWallet = async (req, res, next) => {
  try {
    const { wallet, chain_id } = req.body;
    console
    let user = await User.findOne({ wallet });



    if (!user) {
      return next(new ErrorResponse("User does not exist", 404));
    }
    console.log(user)

    let { dinari_account_id, lastDripAt } = user;

    if (!dinari_account_id) {
      return next(new ErrorResponse("User does not have account id", 404));
    }
    // if (
    //   lastDripAt &&
    //   Date.now() - new Date(lastDripAt).getTime() < 12 * 60 * 60 * 1000
    // ) {
    //   return next(
    //     new ErrorResponse("Cooling period active. Try again later.", 429)
    //   );
    // }
    const balances = await client.v2.accounts.getCashBalances(dinari_account_id);
    console.log(balances)
    const chainBalance = balances.find((b) => b.chain_id === chain_id && b.symbol === "mockUSD");
    const mockUSDBalance = chainBalance ? Number(chainBalance.amount) : 0;
    console.log(mockUSDBalance)
    if (mockUSDBalance >= 500) {
      console.log("here3")
      return next(
        new ErrorResponse(
          `Balance too high (${mockUSDBalance}). Cannot drip more tokens.`,
          400
        )
      );
    }
    console.log("here2")
    console.log("here",chain_id)
    let depositRes = await client.v2.accounts.mintSandboxTokens(
      "0199e8b9-d418-7421-8c6d-3361cc01ed4f",{chain_id:'eip155:11155111'}
    );
    console.log(depositRes)
    user.lastDripAt = new Date();
    await user.save();
    const balances1 = await client.v2.accounts.getCashBalances(dinari_account_id);
    console.log(balances1)

    res.status(200).json({
      success: true,
      message: "Account funded successfully",
      data: { depositRes },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
};

exports.syncUser = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet });
    if (!user) return next(new ErrorResponse("User not found", 404));
    await syncUserWithDinari(user, client);
    res.status(200).json({
      success: true,
      message: "User synced successfully",
      data: { user },
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to sync user", 500));
  }
};

//get user portfolio
exports.getUserPortfolio = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const user = await User.findOne({ wallet });
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (!user.dinari_account_id)
      return next(new ErrorResponse("User does not have account id", 404));
    const portfolio = await client.v2.accounts.getPortfolio(
      user.dinari_account_id
    );

    const stockData = await client.v2.marketData.stocks.list();
   

    // Add current price data to each asset
    for (const stock of portfolio.assets) {
      // Get current price
      const currentPrice =
        await client.v2.marketData.stocks.retrieveCurrentPrice(stock.stock_id);

      // Fetch all stocks (if needed) and filter by symbol

      // Find the stock that matches the symbol
      const stockInfo = stockData.find(
        (s) => s.id === stock.stock_id 
      );

      console.log(stockInfo)

      // Add current price and logo
      stock.current_price = currentPrice.price;
      stock.logo_url = stockInfo?.logo_url ?? null;
    }
    res.status(200).json({
      success: true,
      message: "Portfolio fetched successfully",
      data: { portfolio },
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to fetch portfolio", 500));
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const { wallet } = req.params;
    let { chainId } = req.query;
    if (!wallet) {
      return next(new ErrorResponse("Account ID is required", 400));
    }
    const user = await User.findOne({ wallet });

    if (!user.dinari_account_id) {
      return next(new ErrorResponse("User does not have account id", 400));
    }

    chainId = `eip155:${chainId}`;

    const orders = await client.v2.accounts.orders.list(
      user.dinari_account_id,
      { chain_id: chainId, page_size: 25 }
    );
    console.log(orders);

    res.status(200).json({
      success: true,
      message: "User orders retrieved successfully",
      data: { orders, count: orders.length },
    });
  } catch (error) {
    console.error("Dinari fetch error:", error.message);
    next(new ErrorResponse("Failed to fetch user orders", 500));
  }
};
