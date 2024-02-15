const express = require('express'),
    router = express.Router(),
    cartCtrl = require('../controllers/analytics'),
    isAuth = require("../middleware/is-auth")


router.get("/total-budget",isAuth , cartCtrl.stockBudget)
router.get("/total-orders",isAuth , cartCtrl.totalOrders)
router.get("/total-profits",isAuth , cartCtrl.totalProfits)
router.get("/total-returned",isAuth , cartCtrl.totalReturned)

router.get("/top-selling",isAuth , cartCtrl.topSellingProducts)
router.get("/product-finished",isAuth , cartCtrl.productsFinishedFromStock)


module.exports = router;