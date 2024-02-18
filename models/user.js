const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: false,
    unique: true
  },
  profile: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
    required: true,
  },
  status: {
    type: String,
    default: "Active",
    required: false
  }, 
  isBeClient:{
    type: Boolean,
    required: false,
    default: false
  }
});

module.exports = mongoose.model("User", userSchema);
