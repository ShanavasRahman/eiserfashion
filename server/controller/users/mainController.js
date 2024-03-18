const Product = require("../../model/productModel");
const Category = require("../../model/category");
const User = require("../../model/userModel");
const crypto = require("crypto")
const transporter = require('../../../config/nodemailer');
const Review = require('../../model/reviewModel');
const Offer = require('../../model/offerModel');

const loadHome = async (req, res) => {
  try {
    // Fetch products and categories
    const products = await Product.find().populate('category').populate('offer');
    const categories = await Category.find().populate('products');
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('user/index', { products, categories, user });
  } catch (error) {
    console.log(error);
    // Handle the error appropriately, e.g., render an error page
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expirationTime = Date.now() + 3600000; // Token expires in 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expirationTime;
    await user.save();

    const resetLink = "";
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Click on the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
} 




module.exports = {
  loadHome,
  singleProduct,
  loadForgot,
  forgotPass
};
