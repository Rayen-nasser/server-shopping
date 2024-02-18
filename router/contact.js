const express = require("express");
const router = express.Router();
const contactCtrl = require("../controllers/contact");
const filter = require("../util/filter");
const isAuth = require("../middleware/is-auth");
const multer = require("../middleware/multer-config");

router.get(
  "/all-messages",
  isAuth,
  filter.filterKeyword,
  contactCtrl.gelAllMessage
);
router.get("/message-been-read/:id", isAuth, contactCtrl.hasBeenRead);
router.post("/send-message", multer, contactCtrl.saveMessage);

module.exports = router;
