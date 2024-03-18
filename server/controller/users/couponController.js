const Coupon = require('../../model/couponModel');
const User = require('../../model/userModel');



const applyCoupon = async (req, res) => {
    console.log(req.body);
    const { couponCode, totalPurchaseAmount } = req.body;
    const userId = req.session.userId; 

    try {
        const coupon = await Coupon.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        if (coupon.expirationTime < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (totalPurchaseAmount < coupon.minPurchaseAmount) {
            return res.status(400).json({ error: 'Minimum purchase amount not met' });
        }

        if (coupon.usageLimit <= coupon.usedCount) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ error: 'Coupon already used by the user' });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'Percentage') {
            discountAmount = Math.floor((coupon.discountAmount / 100) * totalPurchaseAmount);
        } else if (coupon.discountType === 'Fixed amount') {
            discountAmount = coupon.discountAmount;
        }

        if (discountAmount < 0) {
            return res.status(400).json({ error: 'Discount amount cannot be negative' });
        }

        if (discountAmount > totalPurchaseAmount) {
            return res.status(400).json({ error: 'Discount amount cannot exceed total purchase amount' });
        }

        const finalAmount = totalPurchaseAmount - discountAmount;

        if (finalAmount < 0) {
            return res.status(400).json({ error: 'Final amount cannot be negative' });
        }

        coupon.usedCount++;

        await coupon.save();

        res.json({ discountAmount, finalAmount });
    } catch (error) {
        console.log('Error applying coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports = applyCoupon;