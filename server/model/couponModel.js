const mongoose = require('mongoose');

// Define schema
const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        required: true
    },
    expirationTime: {
        type: Date,
        required: true
    },
    discountAmount: {
        type: Number,
        required:true  
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'active'
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
})

// Generate a random coupon code
couponSchema.pre('save', function(next) {
    if (!this.couponCode) {
        this.couponCode = generateCouponCode();
    }
    next();
});

// Function to generate random coupon code
function generateCouponCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Create model
const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
module.exports.generateCouponCode = generateCouponCode;
