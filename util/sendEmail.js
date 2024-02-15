const nodemailer = require('nodemailer');
exports.sendEmailToOwner = (messageData) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    secure: true, // upgrade later with STARTTLS and support for non-465 ports
    auth: {
      user: process.env.USER,
      pass: process.env.EMAIL_API_KEY,
    },
  });

  const mailOptions = {
    from: process.env.USER,
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
