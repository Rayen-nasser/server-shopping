const Cart = require("../models/cart");
const User = require("../models/user");
const { sendEmailToOwner } = require("../util/sendEmail");
const Product = require("../models/product");

module.exports.getSalesLast24Hours = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = await Cart.find({
      date: { $gte: twentyFourHoursAgo },
    }).populate("userId", "username phoneNumber");

    const formattedCarts = carts.map((cart) => ({
      username: cart.userId.username,
      phoneNumber: cart.userId.phoneNumber,
      date: cart.date,
      amountTotal: cart.amountTotal,
      sale: cart.sale,
    }));

    return res.status(200).json({ sales: formattedCarts });
  } catch (error) {
    console.error("Error retrieving sales in the last 24 hours:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.getAllCarts = (req, res, next) => {
  const limit = Number(req.query.limit) || 0;
  const currentPage = Number(req.query.page);
  const sort = req.query.sort == "asc" ? 1 : -1;
  let totalItems;

  Cart.find(res.locals.filter)
    .countDocuments()

    .then((result) => {
      totalItems = result;
      return Cart.find(res.locals.filter)
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .sort({ date: sort });
    })
    .then((result) => {
      if (!result) {
        const error = new Error("No Carts Found");
        error.statusCode = 200;
        throw error;
      } else {
        res.status(200).json({
          carts: result,
          totalItems: totalItems,
        });
      }
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};
module.exports.getCart = async (req, res, next) => {
  const cartId = req.params.id;
  try {
    const cart = await Cart.findById(cartId)
      .populate({
        path: "userId",
        select: "username email phoneNumber profile",
      })
      .populate({
        path: "products.productId",
        select: "imageUrl marque price amountTotal", // Select only necessary fields from the product
      });

    if (!cart) {
      const error = new Error("Could not find the cart");
      error.statusCode = 200;
      throw error;
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports.getCartByUserId = (req, res, next) => {
  const userId = req.params.userid,
    startDate = req.query.startDate || new Date("1970-1-1"),
    endDate = req.query.endDate || new Date();

  Cart.find({
    userId,
    date: { $gte: new Date(startDate), $lt: new Date(endDate) },
  }).then((result) => {
    if (!result) {
      res.status(404).send("No carts for this User ID");
    } else {
      res.status(200).json({
        carts: result,
      });
    }
  });
};
module.exports.addCart = async (req, res, next) => {
  try {
    const { userId, products, amountTotal, address } = req.body;

    if (!userId || !products || !amountTotal || !address) {
      return res
        .status(400)
        .json({ message: "Please provide required fields" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const productDetails = await Promise.all(
      products.map(async (product) => {
        const productData = await Product.findById(product.productId);
        return {
          name: productData.name,
          price: productData.price,
          quantity: product.quantity,
        };
      })
    );

    const cart = new Cart({
      userId,
      products,
      amountTotal,
      address,
    });

    await cart.save();

    res.json({
      status: "success",
      message:
        "Sended Successfully!\n We will call you when your order is ready.",
    });

    const emailToClient = {
      email: user.email,
      subject: "Order Confirmation",
      body: `Dear ${
        user.username
      }, \n Your order was successful! Here are the details of your order:\n\nOrder Number: ${
        cart._id
      }\nDate: ${cart.date}\n\nProducts:\n${productDetails
        .map(
          (p) => `Name: ${p.name}, Price: ${p.price}, Quantity: ${p.quantity}`
        )
        .join("\n")}\n\nTotal Amount: ${amountTotal}`,
    };

    sendEmailToOwner(emailToClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports.acceptOrder = async (req, res, next) => {
  const { userId, cartId } = req.query;

  try {
    const cart = await Cart.findOne({ _id: cartId }).populate(
      "products.productId"
    );

    if (cart.sale === "Delivered") {
      return res
        .status(406)
        .json({ message: "This order has been Delivered!" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    for (const product of cart.products) {
      const availableStock = product.productId.quantity;
      if (product.quantity < availableStock) {
        const message = {
          email: user.email,
          subject: "Your Order",
          body: `The requested quantity for product ${product.productId.name} exceeds the available stock. Only ${availableStock} units can be fulfilled.`,
        };

        await sendEmailToOwner(message);
        //@TODO : get  decision of user about  this step?

        const editProduct = {
          ...product.productId.toObject(),
          quantity: Math.max(availableStock - product.quantity, 0),
        };

        await Product.updateOne({ _id: product.productId._id }, editProduct);
      }
    }

    const message = {
      email: user.email,
      subject: "Your Order Has been Accepted",
      body: "Congratulations! Your order has been accepted by our team.\nPlease wait until we contact you with your phone number to get your demand and proceed with payment",
    };

    // Assuming sendEmailToOwner is an asynchronous function
    await sendEmailToOwner(message);

    const updatedCart = await Cart.findOneAndUpdate(
      { _id: cartId },
      { sale: "Pending" },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Order accepted successfully!", updatedCart });
  } catch (error) {
    console.error("Error accepting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.deliveredOrder = async (req, res, next) => {
  try {
    const cartId = req.params.id;

    let cart = await Cart.findById(cartId);
    if (!cart) {
      throw new NotFoundError("This cart does not exist.");
    }
    console.log(cart.sale);
    if (cart.sale === "Delivered") {
      throw new BadDataError(
        "This order has already been delivered or cancelled."
      );
    }

    cart = await Cart.findByIdAndUpdate(
      cart._id,
      { sale: "Delivered" },
      { new: true }
    ).exec();

    res.status(200).json({ message: "Order marked as completed!" });
  } catch (error) {
    next(error);
  }
};
module.exports.cancelOrder = async (req, res, next) => {
  //TODO: add validation for user id in the body matches authenticated user
  const reason = req.body.reason || "";
  try {
    const cartId = req.params.id;
    let cart = await Cart.findById(cartId).populate("items").exec();

    if (!cart) {
      throw new NotFoundError("The specified cart could not be found");
    }
    if (cart.sale !== "Pending") {
      throw new BadDataError("You can only cancel a Pending Order!");
    }
    cart.items.forEach((item) => {
      item.quantity = 0;
    });
    cart.sale = "Cancelled";
    cart.save();
    res
      .status(201)
      .json({ message: "Cart has been successfully Cancelled", reason });
  } catch (err) {
    return next(new ServerError("There was an error processing your request"));
  }
};
module.exports.deleteCart = (req, res, next) => {
  const cartId = req.params.id;
  Cart.deleteOne({ _id: cartId })
    .then((cart) => {
      if (!cart) {
        const error = new Error("Could not find the cart");
        error.statusCode = 200;
        throw error;
      }
      res.status(200).json({
        message: `Deleted cart with id ${cartId}`,
      });
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};
module.exports.returnedCart = async (req, res, next) => {
  try {
    const { id: cartId } = req.params;
    const products = req.body;

    // Find the original cart by ID and populate its products
    const originalCart = await Cart.findOne({ _id: cartId }).populate(
      "products.productId"
    );

    if (!originalCart) {
      throw new NotFoundError("This cart does not exist.");
    }

    let originalAmountTotal = 0;

    // Update inventory for returned products and calculate new amountTotal for original cart
    for (const returnedProduct of products) {
      const productInOriginalCart = originalCart.products.find(
        (p) => p.productId._id.toString() === returnedProduct.productId
      );

      if (productInOriginalCart) {
        // Update inventory for returned product
        productInOriginalCart.quantity = returnedProduct.newQte;
        productInOriginalCart.productId.quantity += returnedProduct.returnQte;

        // Update the product in the database
        await Product.updateOne(
          { _id: productInOriginalCart.productId._id },
          { quantity: Math.max(productInOriginalCart.productId.quantity, 0) }
        );

        // Calculate new amountTotal for original cart
        originalAmountTotal +=
          returnedProduct.newQte * productInOriginalCart.productId.price;
      }
    }

    // Update sale status to "Delivered" and amountTotal in the original cart
    originalCart.sale = "Delivered";
    originalCart.amountTotal = originalAmountTotal;

    // Save the changes to the original cart
    await originalCart.save();

    // Create a new returned cart
    const returnedCart = new Cart({
      originalCart: originalCart._id,
      userId: originalCart.userId,
      sale: "Returned",
      date: new Date(),
    });

    let amountTotalReturned = 0;

    // Process returned products and update the returned cart
    for (const returnedProduct of products) {
      const productInReturnedCart = originalCart.products.find(
        (p) => p.productId._id.toString() === returnedProduct.productId
      );

      if (productInReturnedCart) {
        // Add returned product to the returned cart
        returnedCart.products.push({
          productId: productInReturnedCart.productId,
          quantity: returnedProduct.returnQte,
        });

        // Calculate amountTotal for returned cart
        amountTotalReturned +=
          productInReturnedCart.productId.price * returnedProduct.returnQte;
      }
    }

    // Set the calculated amountTotal for returned cart
    returnedCart.amountTotal = amountTotalReturned;

    // Save the returned cart to the database
    await returnedCart.save();

    res.status(200).json({ message: "Cart marked as returned successfully." });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
