const Cart = require("../models/cart");
const Product = require("../models/product");

module.exports.stockBudget = async (req, res, next) => {
  try {
    const allProducts = await Product.find();

    const stockBudget = allProducts.reduce((totalBudget, product) => {
      const productCost = product.price * product.quantity;
      return totalBudget + productCost;
    }, 0);

    return res.status(200).json({ total: stockBudget });
  } catch (error) {
    console.error("Error calculating stock budget:", error.message);
    return 0;
  }
};
module.exports.totalOrders = async (req, res, next) => {
  try {
    const orders = await Cart.find({ sale: { $in: ["Delivered", "Pending"] } });

    let totalOrderAmount = 0;

    orders.forEach((order) => {
      totalOrderAmount += order.amountTotal || 0;
    });

    return res.status(200).json({ total: totalOrderAmount });
  } catch (error) {
    console.error("Error calculating total order amount:", error);
    return 0;
  }
};
module.exports.totalProfits = async (req, res, next) => {
  try {
    const carts = await Cart.find({ sale: { $in: ["Delivered", "Pending"] }}).populate(
      "products.productId"
    );

    let totalProfit = 0;

    carts.forEach((cart) => {
      let cartProfit = 0;

      cart.products.forEach((product) => {
        const profit =
          (product.productId.price - product.productId.cost) * product.quantity;
        cartProfit += profit;
      });

      totalProfit += cartProfit;
    });

    return res.status(200).json({ total: totalProfit });
  } catch (error) {
    console.error("Error finding total profit:", error);
    return 0;
  }
};
module.exports.totalReturned = async (req, res, next) => {
  try {
    const returnedOrders = await Cart.find({ sale: "Returned" });

    const totalReturned = returnedOrders.reduce(
      (total, order) => total + order.amountTotal,
      0
    );

    return res.status(200).json({ total: totalReturned });
  } catch (error) {
    console.error(
      error.message
    );
    return res.status(200).json({ total: 0 });
  }
};
module.exports.topSellingProducts = async (req, res, next) => {
  try {
    const topSellingProducts = await Cart.aggregate([
      { $unwind: "$products" }, // Unwind the products array
      {
        $group: {
          _id: "$products.productId", // Group by productId
          totalQuantitySold: { $sum: "$products.quantity" }, // Sum up the quantities
        },
      },
      { $sort: { totalQuantitySold: -1 } }, // Sort in descending order
      { $limit: 10 }, // Limit to the top 10 selling products
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $addFields: {
          productInfo: { $arrayElemAt: ["$productDetails", 0] },
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalQuantitySold: 1,
          imageUrl: "$productInfo.imageUrl",
          marque: "$productInfo.marque",
          name: "$productInfo.name",
          price: "$productInfo.price",
        },
      },
    ]);

    return res.status(200).json({ selling: topSellingProducts });
  } catch (error) {
    console.error("Error finding top selling products:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.productsFinishedFromStock = async (req, res, next) => {
  try {
    const productsFinishedFromStock = await Product.find({
      quantity: { $lte: 0 },
    });

    // Map the products to retrieve only necessary information
    const productsInfo = productsFinishedFromStock.map((product) => ({
      name: product.name,
      marque: product.marque,
      imageUrl: product.imageUrl,
    }));

    return res.status(200).json({ products: productsInfo });
  } catch (error) {
    console.error(
      "Error retrieving products finished from stock:",
      error.message
    );
    return [];
  }
};
