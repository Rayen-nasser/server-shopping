const { filterKeyword } = require("../controllers/filter");

const express = require("express"),
  router = express.Router(),
  cartCtrl = require("../controllers/cart"),
  isAuth = require("../middleware/is-auth");

router.get("/recent-sales", isAuth, cartCtrl.getSalesLast24Hours);
router.get("/all-carts", isAuth, filterKeyword, cartCtrl.getAllCarts);
router.get("/all-carts", isAuth, filterKeyword, cartCtrl.getAllCarts);
router.get("/accept-order", isAuth, cartCtrl.acceptOrder);
router.get("/:id", isAuth, cartCtrl.getCart);
router.post("/add-cart", isAuth, cartCtrl.addCart);
router.get("/delivered-order/:id", isAuth, cartCtrl.deliveredOrder);
router.put("/returned-order/:id", isAuth, cartCtrl.returnedCart);

router.get("/user/:userid", isAuth, cartCtrl.getCartByUserId);
// router.put('/update-cart/:id', cartCtrl.updateCart)
router.delete("/:id", isAuth, cartCtrl.deleteCart);

module.exports = router;
