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

// this middleware function enables Cross-Origin Resource Sharing (CORS) for Express.js application
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

//making the parsed data accessible via req.body
app.use(express.json());

// static files are served from here when a request is made to them
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/stock", stockRouter);
app.use("/api/auth", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/analytics", analyticRouter);
app.use("/api/contact", contactRouter);

app.post('/api/forget-password', passwordCtrl.forgetPassword);
app.post('/api/reset-password/:userId/:token', passwordCtrl.resetPassword);

module.exports = app;
