const Product = require("../../model/productModel");
const Category = require("../../model/category");
const Offer = require('../../model/offerModel');




const addCategory = async (req, res) => {
  try {
    const { category } = req.body;

    // Check if the category name already exists (case-insensitive)
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const newCategory = new Category({ name: category });
    const savedCategory = await newCategory.save();

    // Return success response to the frontend
    res.status(200).json({ message: "Category added successfully", category: savedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

  
  const loadCategory = async (req, res) => {
    try {
      const categories = await Category.find().populate("products");
      const offers = await Offer.find();
      if (categories.length > 0) {
        for (const category of categories) {
          category.productCount = category.products.length;
        }
  
        res.render("admin/category", { categories, offers });
      } else {
        res.render("admin/category", {
          categories: [],
          message: "No categories found!!!",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  const deleteCategory = async (req, res) => {
    try {
      const categoryId = req.body.categoryId;
  
      const category = await Category.findById(categoryId);
  
      if (!category) {
        return res.status(404).send("Category not found");
      }
  
      // Show a confirmation prompt to the user
  
      const productsToUpdate = await Product.find({ category: category._id });
  
      for (const product of productsToUpdate) {
        if (product.category !== null) {
          product.category = null;
          await product.save();
        }
      }
  
      await Category.deleteOne({ _id: categoryId });
  
      res.redirect("/admin/category");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
};

const updateCategory = async (req, res) => {
  try {
    console.log(req.body);
    const categoryId = req.body.id;
    const newName = req.body.category;

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp('^' + newName + '$', 'i') } });
    if (existingCategory && existingCategory._id != categoryId) {
      return res.status(400).send({ error: 'Category with the new name already exists' });
    }

    // Update the category
    const category = await Category.findByIdAndUpdate(categoryId, { name: newName }, { new: true });
    console.log(category);

    res.status(200).send({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
};


  
module.exports = {
  loadCategory,
  addCategory,
  deleteCategory,
  updateCategory
};