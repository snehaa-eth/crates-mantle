const express = require("express");
const router = express.Router();

const {
  getAllStocks,
  registerXStocks,
  getStockPrices,
  updateStockPrices
} = require("../controllers/stocks.controller");

router.get("/", getAllStocks);
router.post("/",registerXStocks);
router.post("/get-price",getStockPrices);
router.get("/update-prices",updateStockPrices)

module.exports = router;
