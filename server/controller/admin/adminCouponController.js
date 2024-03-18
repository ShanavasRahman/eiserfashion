const Coupon = require('../../model/couponModel');


const loadCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render("admin/coupon", { coupons,req });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
};



const addCoupon = async (req, res) => {
    try {
        console.log("hi i am here");
        console.log(req.body);
        const { discountType, minPurchaseAmount, usageLimit, discountAmount } = req.body;

        // Check if all values are non-negative numbers
        if (minPurchaseAmount < 0 || usageLimit < 0 || discountAmount < 0) {
            return res.status(400).json({ error: 'Values must be non-negative numbers' });
        }

        // Check if minPurchaseAmount is not greater than discountAmount
        if (minPurchaseAmount < discountAmount) {
            return res.status(400).json({ error: 'minPurchaseAmount cannot be lesser than discountAmount' });
        }

        // Check if discountAmount is not greater than 100 when discountType is 'percentage'
        if (discountType.toLowerCase() === 'percentage' && discountAmount > 100) {
            return res.status(400).json({ error: 'discountAmount cannot be greater than 100 when discountType is percentage' });
        }

        const couponCode = Coupon.generateCouponCode();

        const expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 7);

        console.log(discountType, minPurchaseAmount, usageLimit);
        console.log(couponCode);
        const coupon = new Coupon({
            couponCode,
            discountType,
            expirationTime,
            discountAmount,
            minPurchaseAmount,
            usageLimit
        });
        console.log(coupon);
        await coupon.save();

        // Send success response
        res.status(200).json({ message: 'Coupon created successfully' });
    } catch (error) {
        // Send error response with the error message
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};




const updateCoupon = async (req, res) => {
    try {
        const { editCouponId, editDiscountType, editMinPurchaseAmount, editDescription, editDiscountAmount } = req.body;

        // Validate input fields
        if (editMinPurchaseAmount < 0 || editDiscountAmount < 0) {
            return res.status(400).json({ success: false, error: 'Amounts cannot be less than 0' });
        }

        if (editDiscountType === 'Fixed amount' && editDiscountAmount > editMinPurchaseAmount) {
            return res.status(400).json({ success: false, error: 'Discount amount cannot be greater than minimum purchase amount' });
        }

        if (editDiscountType === 'Percentage' && (editDiscountAmount < 0 || editDiscountAmount > 100)) {
            return res.status(400).json({ success: false, error: 'Discount percentage must be between 0 and 100' });
        }

        const coupon = await Coupon.findById(editCouponId);

        if (!coupon) {
            return res.status(404).json({ success: false, error: 'Coupon not found' });
        }

        coupon.discountType = editDiscountType;
        coupon.minPurchaseAmount = editMinPurchaseAmount;
        coupon.description = editDescription;
        coupon.discountAmount = editDiscountAmount;

        await coupon.save();

        res.status(200).json({ success: true, message: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, message: 'Error updating coupon' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;

        // Perform deletion operation
        await Coupon.findByIdAndDelete(couponId);

        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, message: 'Error deleting coupon' });
    }
};

module.exports = {
    loadCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon
};