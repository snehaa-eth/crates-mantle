const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Specific routes (must come before parameterized routes)
router.post('/register', userController.registerUser);
router.post('/link-wallet', userController.linkYourWallet);
router.post('/fund-wallet-from-treasury', userController.fundWalletFromTreasury);
router.post('/fund-wallet', userController.fundAccountWallet);
router.get('/kyc/:entity_id', userController.createKYCLink);
router.get('/sync-user/:wallet', userController.syncUser);

// Parameterized routes (must come after specific routes)
router.get('/:wallet', userController.getUserByWallet);
router.post('/:wallet/subscribe', userController.subscribeCrate);
router.post('/:wallet/reinvest', userController.reinvestInCrate);
router.get('/:wallet/portfolio/stats', userController.getUserPortfolioStats);
router.get('/:wallet/portfolio/stocks', userController.getUserPortfolioStocks);
router.get('/:wallet/dinari-portfolio', userController.getUserPortfolio);
router.get('/:wallet/dinari-orders', userController.getUserOrders);

module.exports = router;