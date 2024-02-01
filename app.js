const express = require("express");
const app = express();
const stockRouter = require("./router/stock");
const userRouter = require("./router/auth");
const cartRouter = require("./router/cart");
const path = require("path");
const { dbConnect } = require("./util/database");
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

module.exports = app;
