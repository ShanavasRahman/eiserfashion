const User = require('../../model/userModel');
const Address = require('../../model/addressModel');
const Product = require('../../model/productModel');
const Coupon = require('../../model/couponModel');



const loadCheckout = async (req, res) => {
    try {
        console.log(req.query);
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const address = await Address.find({ userId: user._id });

        const fromCart = req.query.fromCart === 'true';
        let couponDetails = null;
        if (fromCart) {
            const cartItems = [];
            couponDetails = await Coupon.find();
            console.log(user.cart);
            for (const cartItem of user.cart) {
                const product = await Product.findById(cartItem.product);
                if (!product) {
                    return res.status(404).json({ error: `Product with ID ${cartItem.product} not found` });
                }
                if (product.stock <= 0) {
                    return res.status(400).json({ error: `Product ${product.name} is out of stock` });
                }

                if (cartItem.quantity > product.stock) {
                    return res.status(400).json({ error: `Selected quantity for ${product.name} is greater than available stock` });
                }

                const price = product.offer ? product.offerPrice : product.price;

                cartItems.push({
                    product,
                    quantity: cartItem.quantity,
                    total: cartItem.quantity * price
                });
            }
            

            res.render("user/checkout", { user, address, cartProducts: cartItems, fromCart, coupons:couponDetails });
        } else {
            const productId = req.query.productId;
            const quantity = req.query.quantity;
            couponDetails = await Coupon.find();

            if (!productId || !quantity) {
                return res.status(400).json({ error: 'Product ID or quantity not provided in the query parameters' });
            }

            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ error: `Product with ID ${productId} not found` });
            }

            if (product.stock <= 0) {
                return res.status(400).json({ error: `Product ${product.name} is out of stock` });
            }

            if (quantity > product.stock) {
                res.status('error', `Selected quantity for ${product.name} is greater than available stock`);
            }

            const price = product.offerPrice || product.price;
            const totalPrice = price * quantity;

            res.render("user/checkout", { user, address, cartProducts: [{ product, quantity, total: totalPrice }], fromCart,coupons:couponDetails });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = loadCheckout;
