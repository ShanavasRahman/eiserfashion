const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
            default: 1
        },
        total: {
            type: Number,
            default: 0
        }
    }],
    totalCartAmount: {
        type: Number,
        default: 0
    },
    is_admin: {
        type: Number,
        default: 0
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    wallet: {
        balance: {
            type: Number,
            default: 0
        },
        transactions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction'
        }]
    }
});



const User = mongoose.model('User', userSchema);

module.exports = User;
