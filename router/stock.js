const express = require("express");
const router = express.Router();

const stuffCtrl = require("../controllers/stock");
const multer = require("../middleware/multer-config");
const filterProduct = require("../controllers/filter");
const isAuth = require('../middleware/is-auth')

router.get("/all-products", filterProduct.filterKeyword , stuffCtrl.getAllProducts);
router.get("/categories", stuffCtrl.getProductsCategories); // must be on the top of router because will not work 

router.get("/product-details/:id", stuffCtrl.getProduct);
router.get("/category/:category", stuffCtrl.getProductsInCategory);

router.post("/add-product", isAuth, multer, stuffCtrl.createProduct);
router.put("/edit-product/:id", isAuth , multer, stuffCtrl.updateProduct);
router.delete("/delete-product/:id", isAuth , stuffCtrl.deleteProduct);

router.get("/change-status/:id", isAuth, stuffCtrl.changeStatusProduct);


module.exports = router;
