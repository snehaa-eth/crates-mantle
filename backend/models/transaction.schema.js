const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  crateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Crate",
    required: true,
  },
  orderIds: {
    type: [String],
    default: [],
  },
  txHash: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  totalAmountInvested: {
    type: Number,
    required: true,
    min: 0,
  },
  totalFeesDeducted: {
    type: Number,
    default: 0,
    min: 0,
  },
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
}, {
  timestamps: true,
});

TransactionSchema.index({ txHash: 1 });

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = Transaction;
