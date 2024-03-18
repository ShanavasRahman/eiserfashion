const Offer = require('../../model/offerModel');
const Category = require('../../model/category');
const Product = require('../../model/productModel');


const loadOffer = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate({
                path: 'applicableProducts',
                model: 'Product'
            })
            .populate({
                path: 'applicableCategories',
                model: 'Category'
            });

        res.render("admin/offer", { offers }); 
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
    }
};





const addOffer=async (req, res) => {
    try {
        const {
            description,
            discountType,
            discountAmount,
            usageLimit,
            validityPeriodStart,
            validityPeriodEnd,
            conditions
        } = req.body;

        const newOffer = new Offer({
            description,
            discountType,
            discountAmount,
            usageLimit,
            validityPeriod: {
                start: validityPeriodStart,
                end: validityPeriodEnd
            },
            conditions
        });

        // Save the new offer to the database
        const savedOffer = await newOffer.save();

        // Send a success response
        res.status(201).json(savedOffer);
    } catch (error) {
        // Handle errors
        console.error('Error adding offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const applyCategoryOffer = async (req, res) => {
    try {
        console.log("hi iam here");
        console.log(req.body);
        const { categoryId, offerId } = req.body;

        const category = await Category.findById(categoryId).populate('products');

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        if (offer.applicableCategories.includes(categoryId)) {
            return res.status(400).json({ success: false, error: 'Offer is already applied to the category' });
        }

        if (offer.status !== "Active" || new Date(offer.endDate) < new Date()) {
            return res.status(400).json({ success: false, error: 'Offer is expired or deactivated' });
        }

        for (const product of category.products) {
            if (offer.applicableProducts.includes(product._id)) {
                console.log(`Offer is already applied to product ${product._id}`);
                return res.status(400).json({ success: false, error: `Offer is already applied to product ${product._id}` });
            }

            const newOfferPrice = Math.floor(product.price - (product.price * (offer.discountAmount / 100)));

            product.offerPrice = newOfferPrice;
            product.offer = offerId;

            await product.save();

            offer.applicableProducts.push(product._id);
        }

        offer.applicableCategories.push(categoryId);

        await offer.save();

        res.status(200).json({ success: true, message: 'Offer applied to all products in the category' });
    } catch (error) {
        console.error('Error applying offer:', error);
        res.status(500).json({ success: false, error: 'Error applying offer' });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;

        // Find the category
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Find the offer that is applied to the category
        const offer = await Offer.findOne({ applicableCategories: categoryId });

        if (!offer) {
            return res.status(404).json({ success: false, error: 'Offer not found for the category' });
        }

        // Remove the category from the applicableCategories array in the offer
        offer.applicableCategories = offer.applicableCategories.filter(catId => catId.toString() !== categoryId);

        // Pull product IDs from the applicableProducts array in the offer
        for (const productId of category.products) {
            await Offer.updateMany(
                { applicableProducts: productId },
                { $pull: { applicableProducts: productId } }
            );

            // Remove the offer from the product
            const product = await Product.findById(productId);
            if (product) {
                product.offer = undefined;
                product.offerPrice = undefined; // Optional: Also remove the offer price if needed
                await product.save();
            }
        }

        await offer.save();

        res.status(200).json({ success: true, message: 'Offer removed from category and applicable products'});
    } catch (error) {
        console.error('Error removing offer from category:', error);
        res.status(500).json({ success: false, error: 'Error removing offer from category' });
    }
};






module.exports = {
    loadOffer,
    addOffer,
    applyCategoryOffer,
    removeCategoryOffer
};