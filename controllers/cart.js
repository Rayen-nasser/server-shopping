const Cart = require("../models/cart");
const User = require("../models/user");
const { sendEmail } = require("../util/sendEmail");
const Product = require("../models/product");

module.exports.getSalesLast24Hours = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = await Cart.find({
      date: { $gte: twentyFourHoursAgo },
    }).populate({
      path: "userId",
      select: "username  phoneNumber ",
    });

    const formattedCarts = carts.map((cart) => ({
      code: cart.code,
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
  const userId = req.params.userId;

  Cart.find({
    userId,
    sale: { $in: ["delivered", "pending", "wait"] },
  })
    .populate("products.productId")
    .then((result) => {
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

    sendEmail(emailToClient);
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

    if (cart.sale === "delivered") {
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

        await sendEmail(message);
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

    // Assuming sendEmail is an asynchronous function
    await sendEmail(message);

    const updatedCart = await Cart.findOneAndUpdate(
      { _id: cartId },
      { sale: "pending" },
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
    if (cart.sale === "delivered") {
      throw new BadDataError(
        "This order has already been delivered or cancelled."
      );
    }

    cart = await Cart.findByIdAndUpdate(
      cart._id,
      { sale: "delivered" },
      { new: true }
    ).exec();

    res.status(200).json({ message: "Order marked as completed!" });
  } catch (error) {
    next(error);
  }
};
module.exports.cancelOrder = async (req, res, next) => {
  //TODO: add validation for user id in the body matches authenticated user
  // const reason = req.body.reason || "";
  try {
    const cartId = req.params.id;
    let cart = await Cart.findById(cartId).exec();
    if (!cart) {
      throw new NotFoundError("The specified cart could not be found");
    }
    if (cart.sale !== "pending" && cart.sale !== "wait") {
      res.status(403).json({ error: "You can only cancel a Pending Order!" });
    }
    cart.products.forEach((product) => {
      inventoryQuantity = product.quantity;
      Product.findByIdAndUpdate(product.productId, {
        quantity: product.quantity + product.ordered,
      });
    });

    cart.sale = "cancelled";
    cart.save();
    res.status(201).json({ message: "Cart has been successfully Cancelled" });
  } catch (err) {
    console.log(err);
  }
};
module.exports.deleteCart = async (req, res, next) => {
  const cartId = req.params.id;
  try {
    const cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
      const error = new Error("Could not find the cart");
      error.statusCode = 404; // Set status code to 404 for "Not Found"
      throw error;
    }
    if (cart.sale !== "cancelled") {
      return res
        .status(403)
        .json({ message: "You can only delete a Cancelled Order!" });
    }
    const result = await Cart.deleteOne({ _id: cartId });
    if (result.deletedCount === 0) {
      const error = new Error("Could not delete the cart");
      error.statusCode = 404; // Set status code to 404 for "Not Found"
      throw error;
    }
    res.status(200).json({
      message: `Deleted cart with code: ${cart.code}`,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message }); // Send error message in response
  }
};
module.exports.returnedCart = async (req, res, next) => {
  try {
    // Extract cartId from request parameters and get returned products from request body
    const  cartId = req.params.id;
    const returnedProducts = req.body;
  
    // Find the original cart by ID and populate its products
    const originalCart = await Cart.findOne({ _id: cartId }).populate("products.productId");
  
    // If the original cart is not found, throw a NotFoundError
    if (!originalCart) {
      throw new NotFoundError("This cart does not exist.");
    }
  
    // Initialize total amount for returned products
    let totalReturnedAmount = 0;

    // Update inventory for returned products and calculate new total amount for original cart
    for (const product of returnedProducts) {
      const originalProduct = originalCart.products.find(p => p.productId._id.toString() === product.productId);
      const { returnQte, newQte } = product


      if (originalProduct) {
        // Update inventory for returned product
        originalProduct.quantity = newQte;
        originalProduct.productId.quantity -= returnQte;

        // Calculate total amount for returned products
        totalReturnedAmount += returnQte * originalProduct.productId.price;
        
        // Update the product in the database
        await Product.updateOne(
          { _id: originalProduct.productId._id },
          { quantity: Math.max(originalProduct.productId.quantity, 0) }
        );
      }
    }
  
    // Update sale status to "Delivered" and calculate new total amount in the original cart
    originalCart.sale = "delivered";
    originalCart.amountTotal = Math.abs(originalCart.amountTotal - totalReturnedAmount);
  
    
  
    // Create a new cart for returned products
    const returnedCart = new Cart({
      code: originalCart.code,
      userId: originalCart.userId,
      sale: "returned",
      date: new Date(),
      products: [] 
    });
  
    // Process returned products and update the returned cart
    for (const product of returnedProducts) {
      const originalProduct = originalCart.products.find(p => p.productId._id.toString() === product.productId);
  
      if (originalProduct) {
        // Add returned product to the returned cart
        returnedCart.products.push({
          productId: originalProduct.productId._id,// Remove product if quantity becomes zero
          quantity: product.returnQte,
        });
      }

      if (originalProduct.quantity === 0) {
        removeProductFromCart(originalProduct.productId._id, originalCart);
      }
    }
    
    // Set the total amount for returned cart
    returnedCart.amountTotal = totalReturnedAmount;
  
    // Save the returned cart to the database
    await returnedCart.save();

    // Save changes to the original cart
    await originalCart.save();
  
    // Respond with success message
    res.status(200).json({ message: "Cart marked as returned successfully." });
  } catch (error) {
    // Handle errors
    console.error(error);
    next(error);
  }
  
};


async function removeProductFromCart(productId, cart) {
  try {
    // Find the index of the product to remove
    const indexToRemove = cart.products.findIndex(p => p.productId._id.toString() === productId.toString());
    
    // If the product is found, remove it from the cart
    if (indexToRemove !== -1) {
      cart.products.splice(indexToRemove, 1);
      await cart.save()
    }

  } catch (error) {
    console.error(`Error removing product from cart: ${error}`);
    throw error; // Rethrow the error for handling in the caller function
  }
}
