const mongoose = require("mongoose");

const CartSchema = mongoose.Schema({
  code: {
    type: Number,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: false,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  amountTotal: {
    type: Number,
    require: true,
  },
  address: {
    type: {},
    require: true,
  },
  sale: {
    type: String,
    enum: ["wait", "delivered", "pending", "returned", "cancelled"],
    default: "wait",
    required: false,
  },
});

// Middleware to format price and cost before saving the document
CartSchema.pre("save", function (next) {
  // Format price
  if (this.amountTotal) {
    this.amountTotal = parseFloat(this.amountTotal.toFixed(2));
  }
  next();
});

// Middleware to generate a random 6-digit number for 'code' before saving the document
CartSchema.pre("save", function (next) {
  // Generate random 6-digit number only if 'code' is not set
  if (!this.code) {
    this.code = Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model("Cart", CartSchema);
