const Cart = require("../models/cart");
const User = require("../models/user");
const { sendEmailToOwner } = require("./sendEmail");
const Product = require("../models/product");

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

module.exports.getCart = (req, res, next) => {
  const cartId = req.params.id;
  Cart.findById(cartId)
    .then((cart) => {
      if (!cart) {
        const error = new Error("Could not find the cart");
        error.statusCode = 200;
        throw error;
      }
      res.status(200).json(cart);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
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

module.exports.acceptOrder = async (req, res, next) => {
  const { userId, cartId } = req.query;

  try {
    const cart = await Cart.findOne({ _id: cartId }).populate(
      "products.productId"
    );

    console.log(cart.products);
    if (cart.accepted) {
      return res
        .status(406)
        .json({ message: "This order has already been accepted!" });
    }

    for (const product of cart.products) {
      const availableStock = product.productId.quantity;

      if (product.quantity < availableStock) { 
        const editProduct = {
          ...product.productId.toObject(),
          quantity: availableStock - product.quantity,
        };

        await Product.updateOne({ _id: product.productId._id }, editProduct);
      }
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
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
      { accepted: true },
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

module.exports.addCart = async (req, res, next) => {
  try {
    const { userId, date, products, amountTotal, address } = req.body;

    if (!userId || !products || !amountTotal || !address) {
      return res
        .status(400)
        .json({ message: "Please provide required fields" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBeClient = true;
    const userDetails = user;
    await user.save();

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
      date,
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
      email: userDetails.email,
      subject: "Order Confirmation - Bee's Book",
      body: `Dear ${
        userDetails.username
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

module.exports.addToCart = (req, res, next) => {
  const { newProducts, amountTotal } = req.body;
  const cartId = req.params.id;

  if (!newProducts || !cartId) {
    return res.status(400).json({ message: "Please provide required fields" });
  }

  Cart.findById(cartId)
    .then((result) => {
      if (!result) {
        return res.status(404).json({ message: "Cart not found" });
      }

      let oldProducts = result.products;
      let updatedProducts = [...oldProducts, ...newProducts];

      result.products = updatedProducts;
      if (amountTotal !== undefined) {
        result.amountTotal = amountTotal;
      }
      return result.save();
    })
    .then((updatedCart) => {
      res.json({
        status: "success",
        message: "Products added to cart successfully",
        cart: updatedCart,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    });
};

module.exports.updateCart = (req, res, next) => {
  const { userId, date, products, amountTotal } = req.body;
  const cartId = req.params.id;

  if (!userId || !cartId || !date || !products || !amountTotal) {
    return res.status(400).json({ message: "Please provide required fields" });
  }

  Cart.findById(cartId)
    .then((result) => {
      if (!result) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const cartUpdated = {
        ...(req.body.userId && { userId: req.body.userId }),
        ...(req.body.date && { date: req.body.date }),
        ...(req.body.products && { products: req.body.products }),
        ...(req.body.amountTotal && { amountTotal: amountTotal }),
      };

      return Cart.updateOne({ _id: cartId }, { $ste: cartUpdated });
    })
    .then((updatedCart) => {
      res.json({
        status: "success",
        message: "Cart Updated successfully",
        cart: updatedCart,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    });
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
