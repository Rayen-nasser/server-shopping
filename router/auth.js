const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");
const multer = require("../middleware/multer-config");
const filter = require("../util/filter");
const isAuth = require("../middleware/is-auth");

router.post("/register", multer, authCtrl.register);
router.post("/login", authCtrl.login);

router.get("/all-users", isAuth, filter.filterKeyword, authCtrl.getUsers);
router.get("/user-details/:id", isAuth, authCtrl.getUser);
router.delete("/:id", isAuth, authCtrl.deleteUser);
router.get("/user-status/:id", isAuth, authCtrl.changeUserStatus);

module.exports = router;
