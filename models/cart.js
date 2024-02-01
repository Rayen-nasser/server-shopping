const mongoose = require("mongoose");

const CartSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date:{
    type: Date,
    default: Date.now, // set the default value to the current date
    required: true,
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
  accepted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Cart", CartSchema);
