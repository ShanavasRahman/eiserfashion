const Order = require('../../model/orderModel');


const salesApi = async (req, res) => {
    try {
        const allOrders = await Order.find();
        const sortedOrders = allOrders.sort((a, b) => b.orderDate - a.orderDate);

        const recentOrders = sortedOrders.slice(0, 5);

        const revenueData = prepareRevenueData(recentOrders);

        res.json({ success: true, data: revenueData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

function prepareRevenueData(orders) {
    const revenueByDate = orders.reduce((acc, order) => {
        const orderDate = formatDate(order.orderDate);

        if (!acc[orderDate]) {
            acc[orderDate] = 0;
        }

        acc[orderDate] += order.totalAmount; 

        return acc;
    }, {});

    return {
        labels: Object.keys(revenueByDate),
        data: Object.values(revenueByDate),
    };
}

function formatDate(date) {
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}



const orderOverviewChart = async (req, res) => {
    try {

        console.log("im in order overview");
        const orderStatusCounts = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const labels = orderStatusCounts.map(statusCount => statusCount._id);
        const data = orderStatusCounts.map(statusCount => statusCount.count);

        res.json({ success: true, data: { labels, data } });
    } catch (error) {
        console.error('Error fetching order status counts:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
};





const loadSalesReport = async (req, res) => {
    try {
        const orders = await Order.find().populate('products.product');


        const populatedOrders = await Order.populate(orders, { path: 'user' });


        res.render("admin/salesReport", { orders: populatedOrders });
    } catch (error) {
        console.log(error);
    }
};
const filteredSalesReport = async (req, res) => {
    try {
        const fromDate = new Date(req.query.fromDate);
        const toDate = new Date(req.query.toDate);

        const filteredOrders = await Order.find({
            orderDate: {
                $gte: fromDate,
                $lte: toDate,
            },
        }).populate('products.product').populate('user'); 

        res.json({ success: true, orders: filteredOrders });
    } catch (error) {
        console.error('Error fetching or rendering filtered sales report:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};





module.exports = {
    salesApi,
    orderOverviewChart,
    loadSalesReport,
    filteredSalesReport
};