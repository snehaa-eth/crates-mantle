const express = require('express');
const router = express.Router();
const crateController = require('../controllers/basket.controller');

router.post('/', crateController.createCrate);
router.get('/', crateController.getAllCrates);
router.get('/:id', crateController.getCrateById);
router.put('/:id', crateController.updateCrate);
router.get('/:id/stocks', crateController.getStocksInCrate);
router.put('/:id/rebalance', crateController.rebalanceCrate);
module.exports = router; 