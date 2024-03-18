const Review = require('../../model/reviewModel');
const User = require('../../model/userModel');
const Product = require('../../model/productModel');



const addReview = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login'); 
        }

        const { productId, rating, review } = req.body;
  
        const newReview = new Review({
            productId,
            userId: req.session.userId, 
            rating,
            review
        });
  
        const savedReview = await newReview.save();
  
        res.status(201).json({ success: true, message: 'Review submitted successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

module.exports=addReview