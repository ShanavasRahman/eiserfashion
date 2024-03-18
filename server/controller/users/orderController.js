const Order = require("../../model/orderModel");
const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const razorpay = require('../../../config/razorpay');
const moment = require('moment');
const Transaction = require('../../model/transactionModel');

const createOrder = async (req, res) => {
  try {
      const { selectedAddress, paymentMethod, fromCart, products, razorpayPaymentId, originalAmount, discountedAmount, useWallet, walletAmount } = req.body;
      const userId = req.session.userId;

      if (!userId) {
          return res.status(400).json({ success: false, error: "User ID is missing in the session" });
      }

      const user = await User.findById(userId);

      if (!user) {
          return res.status(400).json({ success: false, error: "User not found" });
      }

      const orderProducts = [];

      // Deduct from the wallet if it's used
      if (useWallet) {
          if (user.wallet.balance < walletAmount) {
              return res.status(400).json({ success: false, error: "Insufficient funds in the wallet" });
          }
         
      }

      // Process order based on 'fromCart' value
      if (fromCart === "true") {
          const productValidationErrors = [];

          for (const productData of user.cart) {
              try {
                  const productDetails = await Product.findById(productData.product);

                  if (!productDetails) {
                      productValidationErrors.push(`Product not found for ID: ${productData.product}`);
                      continue;
                  }

                  const quantity = parseInt(productData.quantity, 10);
                  const total = productDetails.price * quantity;

                  orderProducts.push({
                      product: productData.product,
                      quantity,
                      total,
                      isCancelled: false,
                      returnRequested: "Nil",
                  });
              } catch (error) {
                  console.error("Error validating product details:", error);
                  productValidationErrors.push(error.message);
              }
          }

          if (productValidationErrors.length > 0) {
              return res.status(400).json({ success: false, errors: productValidationErrors });
          }

          // Remove items from the user's cart
          await User.findByIdAndUpdate(userId, { $pull: { cart: { product: { $in: orderProducts.map(p => p.product) } } } });
      } else {
          // Process single product order
          const productId = products[0].product;
          const quantity = parseInt(products[0].quantity, 10);

          const singleProduct = await Product.findById(productId);

          if (!singleProduct) {
              return res.status(400).json({ success: false, error: `Product not found` });
          }

          orderProducts.push({
              product: productId,
              quantity,
              total: discountedAmount,
              isCancelled: false,
              returnRequested: "Nil",
          });
      }

      // Payment method verification
      if (paymentMethod === 'Razorpay') {
          const paymentVerification = await razorpay.payments.fetch(razorpayPaymentId);

          if (paymentVerification.status !== 'authorized') {
              return res.status(400).json({ success: false, error: "Razorpay payment verification failed" });
          }
      }

      // Create the order
      const order = new Order({
          user: userId,
          products: orderProducts,
          totalAmount: originalAmount, // Use the original amount for recording purposes
          orderDate: moment(), // Use moment.js to get the current date
          deliveryDate: calculateDeliveryDate(), // You can also use moment.js for delivery date
          paymentMethod,
          deliveryAddress: selectedAddress,
          status: "Processing",
      });

      // Save the order
      await order.save();

      // Update wallet transaction with the order ID
      if (useWallet) {
        const walletTransaction = new Transaction({
          userId: userId,
          orderId: order._id,
          amount: walletAmount * -1,
          description: `Payment via wallet: ${walletAmount}`,
        });
  
        await walletTransaction.save();
  
        user.wallet.balance -= walletAmount;
        user.wallet.transactions.push(walletTransaction._id);
        await user.save();
      }

      res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error processing the order" });
  }
};






function calculateDeliveryDate() {
  const deliveryDate = moment().add(7, 'days'); 
  return deliveryDate;
}



  
const loadMyorder = async (req, res) => {
  try {
    const userId = req.session.userId;

    const orders = await Order.find({ user: userId })
      .sort({ orderDate: -1 })
          .populate("products.product");

    res.render("user/myorders", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error loading orders" });
  }
};

const loadOrderPlaced = async (req, res) => {
  try {
    res.render("user/orderPlaced");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error loading orders" });
  }
};

const cancelOrder = async (req, res) => {
  try {
      const orderId = req.body.orderId;
      const order = await Order.findById(orderId);

      if (!order) {
          return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "Delivered") {
          // Initialize variable for refund amount
          let refundAmount = 0;

          // Check if the payment method is Razorpay
          if (order.paymentMethod === 'Razorpay') {
              // Refund the entire amount to the wallet
              refundAmount = order.totalAmount;
          } else {
              // Fetch the wallet transaction for this order
              const walletTransaction = await Transaction.findOne({
                  orderId: orderId,
              });
            console.log(walletTransaction);

              if (!walletTransaction) {
                  return res.status(500).json({ error: "Wallet transaction not found" });
              }

              // Refund the wallet amount
              refundAmount = order.totalAmount * -1;
          }

          // Refund the amount to the user's wallet
          const user = await User.findById(order.user);
          if (!user) {
              return res.status(404).json({ error: "User not found" });
          }

          user.wallet.balance += refundAmount;
          await user.save();

          // Create a new transaction for the refund
        const refundTransaction = new Transaction({
          userId: order.user,
          orderId: order._id,
          amount: refundAmount,
          description: 'Refund from cancelled order',
        });

          // Save the refund transaction
          await refundTransaction.save();

          // Update order status to Cancelled
          order.status = "Cancelled";
          await order.save();

          return res.status(200).json({ message: 'Order cancelled and amount refunded successfully.' });
      } else {
          return res.status(400).json({ error: "Order is not cancellable" });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
  }
};



const returnReq = async (req, res) => {
  try {
    const orderId = req.body.orderId;
      
    const order = await Order.findById(orderId);
      
    if (!order || order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Invalid order or order cannot be returned.' });
    }

  
      order.returnRequested = 'Pending'; 

    await order.save();

    res.status(200).json({ message: 'Return request submitted successfully.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  returnReq,
  createOrder,
  loadMyorder,
  loadOrderPlaced,
  cancelOrder,
};
