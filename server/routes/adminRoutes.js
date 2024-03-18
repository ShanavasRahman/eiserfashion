const express = require("express");
const app = express();
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const productController = require('../controller/admin/adminProductController');
const userController = require('../controller/admin/adminUserController');
const authentication = require('../controller/middleware/adminAuthController');
const multer = require('../../config/multer');
const adminOrderController = require('../controller/admin/adminOrderController');
const salesController = require('../controller/admin/adminSalesController');
const couponController = require("../controller/admin/adminCouponController");
const offerController = require("../controller/admin/adminOfferController");
const categoryController= require('../controller/admin/adminCategoryController')



router.get('/',authentication.isLogout, adminController.loadLogin );
router.get('/dashboard',authentication.isLogin, adminController.loadDashboard);
router.post("/login", adminController.verifyLogin);
router.post("/logout", adminController.userLogout);


router.get("/users",authentication.isLogin, userController.loadusers);
router.post('/blockUser',authentication.isLogin, userController.blockUser);

router.get("/orders", authentication.isLogin, adminOrderController.loadOrder);
router.post('/updateOrderStatus/:orderId',authentication.isLogin, adminOrderController.updateOrderStatus);


router.get('/addproducts',authentication.isLogin, productController.loadAddproduct);
router.get('/products',authentication.isLogin, productController.loadProduct);
router.get('/category',authentication.isLogin, categoryController.loadCategory); 
router.get('/editproduct/:productId',authentication.isLogin, productController.editProduct);
router.post("/addproduct",authentication.isLogin,  multer.upload.array('img', 3),multer.imageProcessingMiddleware, productController.addproduct);
router.post('/updateProduct/:productId',authentication.isLogin, multer.upload.array('img', 3),multer.imageProcessingMiddleware, productController.updateProduct);
router.post('/addCategory',authentication.isLogin, categoryController.addCategory);
router.post('/deleteproduct/:productId',authentication.isLogin, productController.deleteProduct);
router.post('/deleteCategory',authentication.isLogin, categoryController.deleteCategory);
router.post('/addCoupon', authentication.isLogin, couponController.addCoupon);
router.post('/updateCoupon', authentication.isLogin, couponController.updateCoupon);
router.post('/deleteCoupon', authentication.isLogin, couponController.deleteCoupon);
router.post('/addOffer',authentication.isLogin, offerController.addOffer);
router.post('/applyCategoryOffer',authentication.isLogin, offerController.applyCategoryOffer);
router.post('/removeCategoryOffer',authentication.isLogin, offerController.removeCategoryOffer);

router.post('/updateCategory', authentication.isLogin, categoryController.updateCategory);
router.post('/updateReturnStatus',authentication.isLogin,adminOrderController.updateReturnStatus)

router.get('/api/salesApi',authentication.isLogin, salesController.salesApi);
router.get('/api/orderStatusCounts',authentication.isLogin, salesController.orderOverviewChart);
router.get('/coupon', authentication.isLogin, couponController.loadCoupon);
router.get('/offer', authentication.isLogin, offerController.loadOffer);



router.get('/salesReport',authentication.isLogin, salesController.loadSalesReport);
router.post('/filteredSalesReport', authentication.isLogin, salesController.filteredSalesReport);

router.delete('/api/delete-image',authentication.isLogin, productController.deleteProductImage);
                             
module.exports=router