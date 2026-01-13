const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// Create transaction (subscribe, reinvest, buy, sell)
router.post('/', transactionController.createTransaction);
// Get transactions by user
router.get('/user/:userId', transactionController.getTransactionsByUser);
// Get transactions by crate
router.get('/crate/:crateId', transactionController.getTransactionsByCrate);
// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
