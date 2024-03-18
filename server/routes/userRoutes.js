const express = require("express");
const app = express();
const router = express.Router();
const loginController = require("../controller/users/loginController");
const mainController = require("../controller/users/mainController")
const profileController = require("../controller/users/profileController");
const authController = require("../controller/middleware/authController");
const authentication = require("../controller/middleware/verificationController");
const cartController = require("../controller/users/cartController");
const checkoutController = require("../controller/users/checkoutController")
const orderController = require('../controller/users/orderController');
const couponController = require('../controller/users/couponController');
const reviewController = require('../controller/users/reviewController');
const walletController = require('../controller/users/walletController');



router.get("/",authController.isLogout, mainController.loadHome);
router.get("/login", loginController.loadLogin) ;
router.get("/signup", loginController.loadSignup) ;
router.get("/home", authController.isLogin,authentication.is_blocked, mainController.loadHome);
router.get("/logout", loginController.userLogout);
router.get('/singleProduct', mainController.singleProduct);
router.get('/forgotPass', authController.isLogout,mainController.loadForgot);
router.get("/otp", loginController.loadOtp);
router.get('/profile', authController.isLogin, authentication.is_blocked, profileController.loadProfile);
router.get('/cart', authController.isLogin, authentication.is_blocked, cartController.loadCart);
router.get('/checkout', authController.isLogin, authentication.is_blocked, checkoutController);
router.get('/myOrders', authController.isLogin, authentication.is_blocked, orderController.loadMyorder);
router.get('/orderPlaced', authController.isLogin, authentication.is_blocked, orderController.loadOrderPlaced);
router.get('/wallet',authController.isLogin, authentication.is_blocked,walletController)

router.post('/createOrder', authController.isLogin, authentication.is_blocked, orderController.createOrder);
router.post('/updateQuantity/:productId', authController.isLogin, authentication.is_blocked, cartController.updateQuantity);
router.post('/removeProduct/:productId', authController.isLogin, authentication.is_blocked, cartController.removeProduct);
router.post("/addToCart",  authController.isLogin, authentication.is_blocked, cartController.addToCart);
router.post('/cancelOrder', authController.isLogin, authentication.is_blocked, orderController.cancelOrder);
router.post('/returnReq', authController.isLogin, authentication.is_blocked, orderController.returnReq);

router.post("/verifyotp",authController.isLogout, loginController.verifyOTP);
router.post("/forgotPass",authController.isLogout, mainController.forgotPass);
router.post("/addAddress", authController.isLogin, authentication.is_blocked, profileController.addAddress);
router.post("/updateAddress", authController.isLogin, authentication.is_blocked, profileController.updateAddress);
router.post("/deleteAddress", authController.isLogin, authentication.is_blocked, profileController.deleteAddress);
router.post("/applyCoupon", authController.isLogin, authentication.is_blocked, couponController);
router.post("/addReview", authController.isLogin, authentication.is_blocked, reviewController);




router.post('/signup',authController.isLogout, loginController.insertUser);
router.post('/login',authController.isLogout, loginController.verifyLogin);
router.post('/logout', authController.isLogin, authentication.is_blocked,loginController.userLogout);
router.post('/resendotp',authController.isLogout, loginController.resendOTP);


 


module.exports=router