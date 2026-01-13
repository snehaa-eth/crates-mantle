const mongoose = require("mongoose");

const CrateStockSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "XStock",
    required: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  }
});

const CrateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  createdBy: { type: String, required: true },
  createProgramAddressSync: { type: String },
  subscriptionAmount: { type: Number, required: true },
  subscriptionPeriod: { type: String }, 
  rebalanceFrequency: { type: String }, 
  riskPercent: { type: Number },
  totalReturnPercent: { type: Number }, // lifetime
  tvl: { type: Number , default: 0 }, // total value locked
  monthlyReturnPercent: { type: Number }, // current month
  activeSubscribers: { type: Number, default: 0 },
  stocks: [CrateStockSchema],
  previousStocks: [CrateStockSchema],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
}, { timestamps: true });

const Crate = mongoose.model("Crate", CrateSchema);
module.exports = Crate; 