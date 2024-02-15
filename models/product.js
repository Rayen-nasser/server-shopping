const mongoose = require("mongoose");

//@TODO : Add marque of product
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

module.exports = mongoose.model("Product", productSchema);
