const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    offerPrice: {
        type: Number,
        default: null 
    },
    description: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    images: [String],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        default: null 
    }
});


const Product = mongoose.model("Product", productSchema);

module.exports = Product;
