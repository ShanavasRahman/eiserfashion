const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['Percentage', 'Fixed amount'],
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 0
    },
    validityPeriod: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' 
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category' 
    }],
    conditions: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Disabled'],
        default: 'Active'
    }
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
