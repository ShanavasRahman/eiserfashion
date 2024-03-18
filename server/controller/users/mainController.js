const Product = require("../../model/productModel");
const Category = require("../../model/category");
const User = require("../../model/userModel");
const crypto = require("crypto")
const transporter = require('../../../config/nodemailer');
const Review = require('../../model/reviewModel');
const bcrypt = require('bcrypt');


const loadHome = async (req, res) => {
  try {
    const products = await Product.find().populate('category').populate('offer');
    const categories = await Category.find().populate('products');
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('user/index', { products, categories, user });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

const singleProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }
    const userId = req.session.userId;

    const user = await User.findById(userId);

    const product = await Product.findById(productId).populate('category');

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Fetch reviews based on the product ID
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).populate('userId');

    // Render the view with the product, user, and reviews data
    res.render("user/singleProduct", { product, user, reviews });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};




const loadForgot= async (req, res) => {
  try {
    
    res.render("user/forgotPass");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



const forgotPass = async (req, res) => {
  console.log(req.body);
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    console.log(user)

    // Check if user is not found
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set the token and its expiration time in the user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Construct the reset link with the token
    const resetLink = `${req.protocol}://${req.get('host')}/resetPassword?token=${token}`;

    // Send the reset link to the user via email
    const mailOptions = {
      from: 'eiser@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Click on the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    // Respond with success message
    return res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Respond with internal server error
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const resetPassword=async (req, res) => {
  try {
    res.render('user/resetPassword');
    } catch (error) {
    console.error('Error loading confirm password page:', error);
    res.status(500).send('Internal Server Error');
  }
}

const updatePassword = async (req, res) => {
  console.log(req.body);
  const { token, password, confirmPassword } = req.body;

  try {
    // Find the user by the reset password token
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    // Check if the token has expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Validate that the two passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset password token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send a response indicating successful password reset
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};






module.exports = {
  loadHome,
  singleProduct,
  loadForgot,
  forgotPass,
  resetPassword,
  updatePassword
};
