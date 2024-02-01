const Product = require("../models/product");
const fs = require("fs");
exports.getAllProducts = (req, res, next) => {
  const currentPage = req.query.page,
    limit = Number(req.query.limit) || 0,
    sort = req.query.sort == "desc" ? -1 : 1;
  let totalItems;

  Product.find(res.locals.filter)
    .countDocuments()
    .then((products) => {
      totalItems = products;
      return Product.find(res.locals.filter)
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .sort({ id: sort });
    })
    .then((result) => {
      if (!result) {
        const error = new Error("No Products Found");
        error.statusCode = 200;
        throw error;
      } else {
        res.status(200).json({
          products: result,
          totalItems: totalItems,
        });
      }
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.getProduct = (req, res, next) => {
  Product.findOne({
    _id: req.params.id,
  })
    .then((product) => {
      if (!product) {
        const error = new Error("Could not find product");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json(product);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};
exports.getProductsCategories = async (req, res, next) => {
  try {
    const data = await Product.distinct("category");

    if (data.length === 0) {
      return res.status(404).json({
        error: "There are no categories in the database yet.",
      });
    }

    res.status(200).json({ categories: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while fetching product categories.",
    });
  }
};

exports.getProductsInCategory = (req, res, next) => {
  const category = req.params.category,
    currentPage = req.query.page;
  (limit = Number(req.query.limit) || 0),
    (sort = req.query.sort == "desc" ? -1 : 1);
  let totalItems;

  Product.find({ category })
    .countDocuments()
    .then((result) => {
      if (!result) {
        let error = new Error("No Products Found...");
        error.statusCode = 400;
        throw error;
      }
      totalItems = result;
      return Product.find({ category })
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .sort({ id: sort });
    })
    .then((status) => {
      res.status(200).json({
        products: status,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      next(err);
    });
};
exports.createProduct = (req, res, next) => {
  //req.body = JSON.parse(req.body);

  const url = req.protocol + "://" + req.get("host");

  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    imageUrl: url + "/images/" + req.file.filename,
    category: req.body.category,
    deadline: req.body.deadline,
    quantity: req.body.quantity,
  });
  Product.find({ name: req.body.name })
    .then((result) => {
      if (result && result.length >= 1) {
        return Promise.reject("This product already exists");
      }
      return product.save();
    })
    .then(() => {
      res.status(201).json({
        message: "Product Created Successfully",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.updateProduct = (req, res, next) => {
  const idProduct = req.params.id;
  const url = req.protocol + "://" + req.get("host");
  let imageUrl = req.body.imageUrl;

  if (req.file) {
    imageUrl = url + "/images/" + req.file.filename;
  }

  // Pick only the fields that are provided with new values
  const productUpdated = {
    ...(req.body.name && { name: req.body.name }),
    ...(req.body.description && { description: req.body.description }),
    ...(req.body.price && { price: req.body.price }),
    ...(imageUrl && { imageUrl: imageUrl }),
    ...(req.body.quantity && { quantity: req.body.quantity }),
    ...(req.body.category && { category: req.body.category }),
    ...(req.body.deadline && { deadline: req.body.deadline }),
  };

  Product.updateOne({ _id: idProduct }, { $set: productUpdated })
    .then((result) => {
      res.status(200).json({ message: `Product updated successfully` });
    })
    .catch((error) => {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Error when updating the product",
        error: error.message,
      });
    });
};

exports.deleteProduct = (req, res, next) => {
  Product.findOne({
    _id: req.params.id,
  }).then((product) => {
    const filename = product.imageUrl.split("/images/")[1];
    fs.unlink("images/" + filename, () => {
      Product.deleteOne({ _id: req.params.id })
        .then(() => {
          res.status(200).json({
            message: `Deleted!`,
          });
        })
        .catch((error) => {
          res.status(500).json({
            error: "Could not delete the product",
          });
        });
    });
  });
};

exports.changeStatusProduct = (req, res, next) => {
  let prodId = req.params.id;
  Product.findByIdAndUpdate(prodId).then((result) => {
    if (!result) {
      let error = new Error("No Product Found With This ID...");
      error.statusCode = 400;
      throw error;
    }
    result.status =
      result.status === "available" ? "not available" : "available";
    result.save().then((success) => {
      res
        .status(200)
        .json({ message: "Change Status of Product Successfully" });
    });
  });
};

