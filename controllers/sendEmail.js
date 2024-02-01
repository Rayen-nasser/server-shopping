const nodemailer = require('nodemailer');
exports.sendEmailToOwner = (messageData) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rayenn38@gmail.com",
      pass: process.env.EMAIL_API_KEY ||"yogm ihjn vkvn eykz",
    },
  });

  const mailOptions = {
    from: "rayenn38@gmail.com",
    to: messageData.email, 
    subject: messageData.subject || "Message Read Notification",
    text: messageData.body ||`Dear ${messageData.name},\n\nYour message has been read.\n\nRegards,\nThe Team`,
  };


  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    }
  });
};
