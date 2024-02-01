const User = require("../models/user");
const Message = require("../models/message");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmailToOwner } = require("./sendEmail");
const fs = require('fs');

exports.register = async (req, res, next) => {
  const { username, email, password, phoneNumber ,role } = req.body;
  const admin = await User.findOne({ username });

  const url = req.protocol + "://" + req.get("host");

  if (admin) {
    return res.json({ message: "Admin Already Exit", color: "danger" });
  }

  if (!req.file) {
      return res.status(400).json({ message: "Profile image is required." });
  }

  let newUser = new User({
    username,
    email,
    phoneNumber,
    profile: url + "/images/" + req.file.filename,
    role: role,
  });

  bcrypt.hash(password, 12).then((hash) => {
    newUser.password = hash;
    newUser
      .save()
      .then((saveUser) => {
        const token = jwt.sign(
          {
            _id: saveUser._id.toString(),
            username: saveUser.username,
            email: saveUser.email,
            profile: saveUser.profile,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "24h",
          }
        );
        res.status(201).json({
          message: "New user created successfully!",
          color: "success",
          token: token,
          userId: saveUser._id.toString(),
        });
      })
      .catch((error) => {
        res.status(400).json({
          message: "Failed to create a new user.",
          error: error,
          color: "danger",
        });
      });
  });
};

exports.login = (req, res, next) => {
  let { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide both email and password.",
    });
  }
  //checking the length of the fields
  if (email.length < 5 || password.length < 7) {
    return res.status(400).json({
      message:
        "email should be at least 5 characters long and Password should be at least 8 characters long",
    });
  }
  User.findOne({ email: email })
    .then((result) => {
      if (!result) {
        return res.status(400).json({
          message:
            "A user with this email could be not found",
        });
      }
      userLogedIn = result;
      return bcrypt.compare(password, result.password);
    })
    .then((loged) => {
      if (!loged) {
        return res.status(400).json({
          message:
            "Invalid Password",
        });
      }
      if (userLogedIn.role == role) return userLogedIn;
    })
    .then((checkRole) => {
      if (!checkRole) {
        const err = new Error("Invalid User Role");
        err.StatusCode = 401;
        throw err;
      }
      return checkRole;
    })
    .then((finalUser) => {
      if (finalUser) {
        if (userLogedIn.role == "user" && userLogedIn.status !== "Active") {
          return res.status(400).json({
            message:
              "Your Account is In-Active .. Please Contact with Administrator",
          });
        } else {
          let token = jwt.sign(
            {
              email: userLogedIn.email,
              userId: userLogedIn._id.toString(),
              profile: userLogedIn.profile,
              username: userLogedIn.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
          );
          res.status(200).json({
            userId: userLogedIn._id.toString(),
            token: token,
          });
        }
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUsers = (req, res, next) => {
  const currentPage = req.query.page,
    limit = Number(req.query.limit) || 0,
    sort = req.query.sort == "desc" ? -1 : 1;
  let totalItems;

  User.find({
    ...res.locals.filter,
    _id: {
      $ne: req.userData.userId,
    }
  })
    .countDocuments()
    .then((search) => {
      totalItems = search;

      return User.find({
        ...res.locals.filter,
        _id: {
          $ne: req.userData.userId,
        }
      })
        .select("-password")
        .sort({ id: sort })
        .skip((currentPage - 1) * limit)
        .limit(limit);
    })
    .then((result) => {
      if (!result) {
        const error = new Error("No Users Found");
        error.statusCode = 200;
        throw error;
      } else {
        res.status(200).json({
          users: result,
          totalItems: totalItems,
        });
      }
    })
    .catch((err) => {
      const error = new Error("No Users Found");
      error.statusCode = 400;
      throw error;
    });
};

exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .select({ password: 0, role: 0, status: 0, isBeClient: 0 })
    .then((result) => {
      if (!result) {
        res.status(404).json({message: "No User Found With This ID..."})
      }
      res.status(200).json(result)
    })
    .catch((err) => {
      const error = new Error("No User Found With This ID...");
      error.statusCode = 400;
      throw error;
    });
};

exports.deleteUser = (req, res, next) => {
  let user;

  User.findById(req.params.id)
    .then((foundUser) => {
      user = foundUser; 
  
      if (!user) {
        return res.status(404).json({ message: "No User Found With This ID..." });
      }

      if (user.isBeClient) {
        return res.status(404).json({ message: "You Can Not Delete Clients..." });
      }
  
      const filename = user.profile.split("/images/")[1];
  
      fs.unlink("images/" + filename, (err) => {
        if (err) {
          return res.status(500).json({
            error: "Could not delete the user profile image file",
          });
        }
  
        
        User.deleteOne({ _id: req.params.id })
          .then((result) => {
            if (result.deletedCount > 0) {
              res.status(200).json({
                message: "User and Profile Deleted Successfully",
              });
            } else {
              res.status(500).json({
                error: "Could not delete the user",
              });
            }
          })
          .catch((error) => {
            res.status(500).json({
              error: "Could not delete the user",
            });
          });
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message,
      });
    });
};

exports.changeUserStatus = (req, res, next) => {
  let userId = req.params.id;

  User.findByIdAndUpdate(userId).then((result) => {
    if (!result) {
      const err = new Error("A user with this Id could be not found");
      err.StatusCode = 401;
      throw err;
    }
    result.status = result.status === "Active" ? "not Active" : "Active";
    return result.save().then((success) => {
      res.status(200).json({
        message: "User Status Changed Successfully",
      });
    });
  });
};

exports.saveMessage = (req, res, next) => {
  const { name, email, subject, body } = req.body;
  const contact = new Message({
    name,
    email,
    subject,
    body
  });

  Message.findOne({ subject })
    .then((existingMessage) => {
      if (existingMessage) {
        return Promise.reject(
          "A message with this subject has been sent before"
        );
      }

      return contact.save();
    })
    .then(() => {
      res.status(201).json({
        message: "Your message has been sent successfully",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};

exports.gelAllMessage = (req, res, next) => {
  const currentPage = req.query.page,
    limit = Number(req.query.limit) || 0,
    sort = req.query.sort == "desc" ? -1 : 1;
  let totalItems;

  Message.find({
    ...res.locals.filter,
  })
    .countDocuments()
    .then((search) => {
      totalItems = search;

      return Message.find({
        ...res.locals.filter, 
      })
        .sort({ id: sort })
        .skip((currentPage - 1) * limit)
        .limit(limit);
    })
    .then((result) => {
      if (!result) {
        const error = new Error("No Messages Found");
        error.statusCode = 200;
        throw error;
      } else {
        res.status(200).json({
          messages: result,
          totalItems: totalItems,
        });
      }
    })
    .catch((err) => {
      const error = new Error("No Messages Found");
      error.statusCode = 400;
      throw error;
    });
};

exports.hasBeenRead = (req, res, next) => {
  let messageData; 

  Message.findById(req.params.id)
    .then((result) => {
      if (!result) {
        let error = new Error("No message found with this ID...");
        error.statusCode = 404;
        throw error;
      }

      // Update the isReadIt property
      result.isReadIt = true;

      // Save the message data for later use
      messageData = result;

      return result.save();
    })
    .then(() => {
      // Send email to the owner of the message
      console.log(messageData);
      sendEmailToOwner(messageData);

      res.status(200).json({ message: "Message has been read" });
    })
    .catch((err) => {
      console.error(err);
      res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" });
    });
};


