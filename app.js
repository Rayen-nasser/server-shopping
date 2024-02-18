const express = require("express");
const app = express();
const stockRouter = require("./router/product");
const userRouter = require("./router/auth");
const cartRouter = require("./router/cart");
const analyticRouter = require("./router/analytics");
const contactRouter = require("./router/contact");
const path = require("path");
const { dbConnect } = require("./util/database");
const passwordCtrl = require('./controllers/passwordReset')


require("dotenv").config();

dbConnect();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/stock", stockRouter);
app.use("/api/auth", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/analytics", analyticRouter);
app.use("/api/contact", contactRouter);

app.post('/api/forget-password', passwordCtrl.forgetPassword);
app.post('/api/reset-password/:userId/:token', passwordCtrl.resetPassword);

module.exports = app;
