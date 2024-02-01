const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  name: {  
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: { 
    type: String,
    required: true,
  },
  isReadIt:{
    type : Boolean ,
    default : false,
    required: false
  }
});

module.exports = mongoose.model("Message", messageSchema);
