const Message = require("../models/message");
const { sendEmailToOwner } = require("../util/sendEmail");
exports.saveMessage = async (req, res) => {
  try {
    const { name, email, subject, body } = req.body;

    if (!name || !email || !subject || !body) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingMessage = await Message.findOne({ subject });
    if (existingMessage) {
      return res
        .status(409)
        .json({ message: "A message with this subject has been sent before" });
    }

    const newMessage = new Message({
      name,
      email,
      subject,
      body,
    });

    await newMessage.save();

    res
      .status(201)
      .json({ message: "Your message has been sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.gelAllMessage = (req, res, next) => {
  const currentPage = req.query.page,
    limit = Number(req.query.limit) || 0,
    sort = req.query.sort == "asc" ? 1 : -1;
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

      result.isReadIt = true;

      messageData = result;

      return result.save();
    })
    .then(() => {
      sendEmailToOwner(messageData);

      res.status(200).json({ message: "Message has been read" });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(err.statusCode || 500)
        .json({ error: err.message || "Internal Server Error" });
    });
};
