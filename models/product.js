const mongoose = require("mongoose");

//@TODO : Add marque of product
const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: false,
  },
  deadline: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    default: "available",
    required: false,
  }
});

module.exports = mongoose.model("Product", productSchema);
