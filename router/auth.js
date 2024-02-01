const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth");
const multer = require("../middleware/multer-config");
const filter = require("../controllers/filter");
const isAuth = require("../middleware/is-auth");

router.post("/send-message",multer, authCtrl.saveMessage);
router.post("/register", multer, authCtrl.register);
router.post("/login", authCtrl.login);

router.get("/all-users", isAuth, filter.filterKeyword, authCtrl.getUsers);
router.get("/user-details/:id", isAuth, authCtrl.getUser);
router.delete("/:id", isAuth, authCtrl.deleteUser);
router.get("/user-status/:id", isAuth, authCtrl.changeUserStatus);

router.get("/all-messages", isAuth, filter.filterKeyword , authCtrl.gelAllMessage);
router.get("/message-been-read/:id", isAuth, filter.filterKeyword , authCtrl.hasBeenRead);

module.exports = router;
