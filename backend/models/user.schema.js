const mongoose = require("mongoose");
const UserBasketSchema = new mongoose.Schema({
  investedAmountUSD: {
    type: Number,
    default: 0
  },
  profitGainedUSD: {
    type: Number,
    default: 0,
  },
  lossUSD: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const UserCrateHoldingSchema = new mongoose.Schema({
  crate: { type: mongoose.Schema.Types.ObjectId, ref: "Crate", required: true },
  investedAmount: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  totalReturnPercent: { type: Number, default: 0 },
  monthlyReturnPercent: { type: Number, default: 0 },
  stockHoldings: [{
    stock: { type: mongoose.Schema.Types.ObjectId, ref: "XStock" },
    sharesOwned: { type: Number },
  }],
});

const UserSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true },
  email: {
    type: String,
  },
  lastDripAt: { type: Date },
  name: { type: String },
  phoneNumber: { type: String },
  dinari_account_id: { type: String },
  is_dinari_wallet_link: { type: Boolean },
  entity_id: { type: String }, // from Dinari
  nationality: { type: String, default: null },
  is_kyc_complete: { type: Boolean, default: false },
  subscribedCrates: [UserCrateHoldingSchema],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  totalInvested: { type: Number, default: 0 },
  totalInvestedCrates: { type: Number, default: 0 },
  totalUniqueStocks: { type: Number, default: 0 },
  totalReturnPercent: { type: Number, default: 0 },
  currentValidateAccounts: [{ type: String }],
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;

