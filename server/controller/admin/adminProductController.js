const Product = require("../../model/productModel");
const Category = require("../../model/category");
const Offer = require('../../model/offerModel');
const path = require('path');
const fs = require('fs');

const loadAddproduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const offer = await Offer.find();

    res.render("admin/addproduct", { categories,offer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const addproduct = async (req, res) => {
  try {
    console.log(req.body);
    const { name, price, description, stock, brand, category, offer } = req.body;

    if (!name || !price || !stock || !brand || !category) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock);

    if (
      isNaN(numericPrice) ||
      isNaN(numericStock) ||
      numericPrice <= 0 ||
      numericStock <= 0
    ) {
      return res.status(400).json({ error: "Invalid price or stock value." });
    }
    const processedImagePaths = req.processedImages || [];

    let offerDetails = null;
    if (offer) {
      offerDetails = await Offer.findById(offer);
      if (!offerDetails) {
        return res.status(404).json({ error: "Offer not found." });
      }
    }

    let offerPrice = null;
    if (offerDetails) {
      if (offerDetails.discountType === 'Percentage') {
        offerPrice = numericPrice * (1 - offerDetails.discountAmount / 100);
      } else if (offerDetails.discountType === 'Fixed amount') {
        offerPrice = numericPrice - offerDetails.discountAmount;
      }
      if (offerPrice < 0) {
        offerPrice = 0;
      }
    }

    const newProduct = new Product({
      name,
      price: numericPrice,
      offerPrice, 
      description,
      stock: numericStock,
      brand,
      images: processedImagePaths,
      category,
      offer: offerDetails ? offerDetails._id : null, 
    });

    const savedProduct = await newProduct.save();

    const categories = await Category.findById(savedProduct.category);

    categories.products.push(savedProduct._id);

    await categories.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const loadProduct = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    if (products.length > 0) {
      res.render("admin/product", { products, req });
    } else {
      res.render("admin/product", {
        products: [],
        message: "No products found!!!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const editProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findOne({ _id: productId });
    const category = await Category.find();
    const offer = await Offer.find();

    res.render("admin/editProduct", { product: product, category, offer });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const updateProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      console.error("Product not found.");
      return res.status(404).send("Product not found");
    }

    const oldCategoryId = existingProduct.category;

    // Check if new images are uploaded
    let processedImagePaths = req.processedImages || [];
    const newImagesUploaded = processedImagePaths.length > 0;

    // If fewer than three new images are uploaded, fill the vacant spaces with existing image URLs
    if (processedImagePaths.length < 3) {
      const existingImageCount = existingProduct.images.length;
      for (let i = 0; i < 3 - processedImagePaths.length; i++) {
        processedImagePaths.push(existingProduct.images[i % existingImageCount]);
      }
    }

    // Retrieve the offer ID from the request body
    const offerId = req.body.offer;

    // Retrieve the offer details if an offer ID is provided
    let offerDetails = null;
    if (offerId) {
      offerDetails = await Offer.findById(offerId);
      if (!offerDetails) {
        console.error("Offer not found.");
        return res.status(404).send("Offer not found");
      }
    }

    // Apply the offer to the product
    if (offerDetails) {
      // Calculate the offer price based on the discount type
      let offerPrice = existingProduct.price;
      if (offerDetails.discountType === "Percentage") {
        offerPrice -= (offerDetails.discountAmount / 100) * existingProduct.price;
      } else if (offerDetails.discountType === "Fixed amount") {
        offerPrice -= offerDetails.discountAmount;
      }
      
      // Set the offer price to the product
      existingProduct.offerPrice = offerPrice;
      existingProduct.offer = offerId;
    } else {
      // If no offer is applied, set the offerPrice to null
      existingProduct.offerPrice = null;
    }

    // Update the product fields
    existingProduct.name = req.body.name;
    existingProduct.category = req.body.category;
    existingProduct.brand = req.body.brand;
    existingProduct.images = processedImagePaths;
    existingProduct.stock = req.body.stock;
    existingProduct.price = req.body.price;
    existingProduct.description = req.body.description;

    // Save the updated product
    const updatedProduct = await existingProduct.save();

    // Remove the product ID from the old category
    if (oldCategoryId) {
      await Category.findByIdAndUpdate(oldCategoryId, {
        $pull: { products: productId },
      });
    }

    // Add the product ID to the new category
    if (req.body.category) {
      await Category.findByIdAndUpdate(req.body.category, {
        $addToSet: { products: productId },
      });
    }

    console.log("Updated Product:", updatedProduct);
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};








const deleteProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    const categoryId = product.category;

    await Category.findByIdAndUpdate(categoryId, {
      $pull: { products: productId },
    });

    await Product.findByIdAndDelete(productId);

    console.log("Product deleted successfully");
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const imageURL = req.query.url;
    const imagePath = path.join(__dirname,"..","..","..", imageURL);
  
    // Check if the file exists before attempting to delete
    const fileExists = fs.existsSync(imagePath);
  
    if (fileExists) {
      await fs.promises.unlink(imagePath); // Delete the file asynchronously
 
      // Find the product that contains the image URL and remove it
      const product = await Product.findOne({ images: imageURL });
      if (product) {
        product.images = product.images.filter(img => img !== imageURL);
        await product.save();
      }
 
      res
        .status(200)
        .json({ success: true, message: "Image deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
 };
 
 

module.exports = {
  loadAddproduct,
  addproduct,
  loadProduct,
  editProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage
};
