const Joi = require("joi");
const User = require("../models/user");
const Token = require("../models/token");
const { sendEmailToOwner } = require("../util/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

exports.forgetPassword = async (req, res) => {
    try {
        const schema = Joi.object({ 
            email: Joi.string().email().required(),
            urlPage: Joi.string().uri()
         });

        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({message: error.details[0].message});

        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).send({ message: 'Email not found' });

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString('hex') 
            }).save();
        }

        // const link = `${req.protocol}://${req.get('host')}/reset-password/${user._id}/${token.token}`;
        const link =`${req.body.urlPage}/${user._id}/${token.token}`;
        const createEmail = {
            body: `Follow this link to reset your password ${link}`,
            subject: "Reset Password",
            email: user.email
        };

        await sendEmailToOwner(createEmail);
        res.status(201).json({ message: 'Check Your Email To Reset The Password' });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const schema = Joi.object({ password: Joi.string().required() });

        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({message:error.details[0].message})

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(400).json({message:"Invalid link or expired"})
        
        const token = await Token.findOne({ userId: user._id, token: req.params.token });
        if (!token) return res.status(400).json({message:"Invalid link or expired"})

        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        user.password = hashedPassword;
        await user.save();
        await Token.deleteOne({ _id: token._id});

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
