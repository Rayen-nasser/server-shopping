const multer = require('multer')
const { filterKeyword } = require('../controllers/filter')

const express = require('express'),
    router = express.Router(),
    cartCtrl = require('../controllers/cart'),
    isAuth = require("../middleware/is-auth")

router.get("/all-carts",isAuth ,filterKeyword ,cartCtrl.getAllCarts)
router.get("/accept-order", cartCtrl.acceptOrder);
router.get("/:id",isAuth, cartCtrl.getCart)
router.get("/user/:userid", cartCtrl.getCartByUserId)

router.post('/add-cart', isAuth, cartCtrl.addCart)
router.put('/add-cart/:id', cartCtrl.addToCart)
router.put('/update-cart/:id', cartCtrl.updateCart)

//router.delete('/remove-from-cart/:productId', cartCtrl.removeFromCart)
router.delete('/:id', cartCtrl.deleteCart)


module.exports = router;