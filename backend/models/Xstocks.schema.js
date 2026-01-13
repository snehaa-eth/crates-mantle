const mongoose = require("mongoose");
const StockSchema = new mongoose.Schema(
  {
    dinari_id: {
      type: String,
      required: true,
      unique: true, 
    },
    cik: {
      type: String,
    },
    composite_figi: {
      type: String,
    },
    cusip: {
      type: String,
    },
    description: {
      type: String,
    },
    display_name: {
      type: String,
    },
    name: {
      type: String,
    },
    symbol: {
      type: String,
    },
    logo_url: {
      type: String,
    },
    is_fractionable: {
      type: Boolean,
    },
    is_tradable: {
      type: Boolean,
    },
    tokens: {
      type: [String], 
      default: [],
    },
    price: { type: Number, default: null }
  },
  { timestamps: true }
);

const XStock = mongoose.model("XStock", StockSchema);
module.exports = XStock;
