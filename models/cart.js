const mongoose = require("mongoose");

const CartSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date:{
    type: Date,
    default: Date.now, 
    required: false,
  }, 
  products: [
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
            } ,
        quantity: {
            type: Number,
            required: true,
        }
    }
  ],
  amountTotal:{
    type: Number,
    require: true
  },
  address: {
    type: {},
    require: true
  },
  sale: {
    type: String,
    enum: ["wait","Delivered", "Pending", "Returned"],
    default: "wait",
    required: false, 
  },
  originalCart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: false
    }
});

module.exports = mongoose.model("Cart", CartSchema);
