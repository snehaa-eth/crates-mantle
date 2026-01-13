const Crate = require("../models/basket.schema");
const XStock = require("../models/Xstocks.schema");
const ErrorResponse = require("../utils/errorResponse");

exports.createCrate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      imageUrl,
      createdBy,
      createProgramAddressSync,
      subscriptionAmount,
      subscriptionPeriod,
      rebalanceFrequency,
      riskPercent,
      totalReturnPercent,
      monthlyReturnPercent,
      stocks,
    } = req.body;

    if (!name || !stocks || stocks.length === 0 || !createdBy) {
      return next(new ErrorResponse("Name, at least one stock, and creator wallet are required", 400));
    }

    // Validate stocks: all referenced XStock IDs must exist
    for (const s of stocks) {
      const stockExists = await XStock.findById(s.stock);
      if (!stockExists) {
        return next(new ErrorResponse(`Stock with ID ${s.stock} not found`, 400));
      }
    }

    const crate = await Crate.create({
      name,
      description,
      imageUrl,
      createdBy,
      createProgramAddressSync,
      subscriptionAmount,
      subscriptionPeriod,
      rebalanceFrequency,
      riskPercent,
      totalReturnPercent,
      monthlyReturnPercent,
      stocks,
    });

    res.status(201).json({
      success: true,
      message: "Crate created successfully",
      data: crate,
    });
  } catch (error) {
    next(new ErrorResponse("Failed to create crate", 500));
  }
};

exports.getAllCrates = async (req, res, next) => {
  try {
    
    const crates = await Crate.find()
      .populate({
        path: "stocks.stock", 
        model: "XStock",
      })
      .populate({
        path: "transactions", 
        model: "Transaction",
      });

    res.status(200).json({
      success: true,
      message: "Crates fetched successfully",
      data: crates,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to fetch crates", 500));
  }
};

exports.getCrateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const crate = await Crate.findById(id)
      .populate({
        path: "stocks.stock",
        model: "XStock",
      })
      .populate({
        path: "transactions",
        model: "Transaction",
      });

    if (!crate) {
      return next(new ErrorResponse("Crate not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Crate fetched successfully",
      data: crate,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to fetch crate", 500));
  }
};

// Update crate (basic info and stocks)
exports.updateCrate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.stocks) {
      // Validate stocks
      for (const s of update.stocks) {
        const stockExists = await XStock.findById(s.stock);
        if (!stockExists) {
          return next(new ErrorResponse(`Stock with ID ${s.stock} not found`, 400));
        }
      }
    }
    const crate = await Crate.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate("stocks.stock");
    if (!crate) {
      return next(new ErrorResponse("Crate not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Crate updated successfully",
      data: crate,
    });
  } catch (error) {
    next(new ErrorResponse("Failed to update crate", 500));
  }
};

// Get all stocks in a crate (with weights and prices)
exports.getStocksInCrate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const crate = await Crate.findById(id).populate("stocks.stock");
    if (!crate) {
      return next(new ErrorResponse("Crate not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Stocks in crate fetched successfully",
      data: crate.stocks,
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch stocks in crate", 500));
  }
};


exports.rebalanceCrate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rebalanceStocks } = req.body;

    // Validate stocks
    for (const s of rebalanceStocks) {
      const stockExists = await XStock.findById(s.stock);
      if (!stockExists) {
        return next(new ErrorResponse(`Stock with ID ${s.stock} not found`, 400));
      }
    }

    // Find the crate
    const crate = await Crate.findById(id);
    if (!crate) {
      return next(new ErrorResponse("Crate not found", 404));
    }

    // ✅ Clone current stocks to avoid reference mutation
    crate.previousStocks = JSON.parse(JSON.stringify(crate.stocks));

    // Update with new stocks
    crate.stocks = rebalanceStocks;

    // Save the changes
    await crate.save();

    res.status(200).json({
      success: true,
      message: "Crate rebalanced successfully",
      data: crate,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorResponse("Failed to rebalance crate", 500));
  }
};

