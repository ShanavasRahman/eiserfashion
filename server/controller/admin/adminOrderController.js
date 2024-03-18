const Order = require('../../model/orderModel');
const User = require('../../model/userModel');

const loadOrder = async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 }).populate('user').populate('products.product');
        console.log(orders);
        res.render('admin/order', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error loading orders' });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.newStatus;
        const productId = req.body.productId;

        const allowedStatus = ['Processing', 'Shipped', 'Delivered', 'Returned'];
        if (!allowedStatus.includes(newStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findById(orderId);

        const statusChange = {
            status: newStatus,
            date: new Date(),
        };
        order.statusChanges.push(statusChange);
        order.status = newStatus;

        const updatedOrder = await order.save();


        res.json({ success: true, message: 'Order status updated successfully', updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateReturnStatus = async (req, res) => {
    try {
        const { orderId, returnRequestStatus } = req.body;

        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the return request status is completed
        if (returnRequestStatus === 'Completed') {
            // Add the order total amount to the user's wallet balance
            const user = await User.findById(order.user);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            user.wallet.balance += order.totalAmount;

            // Create a transaction record for adding the order total amount to the wallet balance
            const walletTransaction = new Transaction({
                userId: user._id,
                amount: order.totalAmount,
                description: 'Refund for returned order',
            });

            // Save the transaction
            await walletTransaction.save();

            // Add the transaction ID to the user's wallet transactions array
            user.wallet.transactions.push(walletTransaction._id);

            // Save the updated user document with the added balance and transaction
            await user.save();
        }

        // Update the returnRequested status
        order.returnRequested = returnRequestStatus;

        // Save the updated order
        const updatedOrder = await order.save();

        res.json({ success: true, message: 'Return request status updated successfully', updatedOrder });
    } catch (error) {
        console.error('Error updating return request status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
    loadOrder,
    updateOrderStatus,
    updateReturnStatus
};


