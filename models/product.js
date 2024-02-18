const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  marque: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: false,
    default: Date.now,
  },
  status: {
    type: String,
    default: "available",
    required: false,
  },
});

// Middleware to format price and cost before saving the document
productSchema.pre("save", function (next) {
  // Format price
  if (this.price) {
    this.price = parseFloat(this.price.toFixed(2));
  }
  // Format cost
  if (this.cost) {
    this.cost = parseFloat(this.cost.toFixed(2));
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
