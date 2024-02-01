const mongoose = require("mongoose");

const dbConnect = (callback) => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Successfully connected to MongoDB Atlas!");
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB Atlas:", error);
    });
};

exports.dbConnect = dbConnect;
