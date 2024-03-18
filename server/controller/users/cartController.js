const User = require("../../model/userModel");
const Product = require("../../model/productModel");

const addToCart = async (req, res) => {
  try {
    console.log("Hello");
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (user.cart.length === 0) {
      user.cart.push({
        product: productId,
        quantity: quantity,
        total: quantity * (product.offerPrice || product.price), 
      });

      user.totalCartAmount += quantity * (product.offerPrice || product.price);

      await user.save();

      return res
        .status(200)
        .json({ message: "Product added to cart successfully", added: true });
    }

    const existingCartItem = user.cart.find((cartItem) =>
      cartItem.product.equals(productId)
    );

    if (existingCartItem) {
      console.log("Product already exists");
      return res
        .status(200)
        .json({ message: "Product already exists in the cart", added: false });
    }

    user.cart.push({
      product: productId,
      quantity: quantity,
      total: quantity * (product.offerPrice || product.price), 
    });

    user.totalCartAmount += quantity * (product.offerPrice || product.price);

    await user.save();

    return res
      .status(200)
      .json({ message: "Product added to cart successfully", added: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId).populate("cart.product");

    const isCartEmpty = !user.cart || user.cart.length === 0;

    res.render("user/cart", { user, isCartEmpty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateQuantity = async (req, res) => {
  const userId = req.session.userId;
  const productId = req.params.productId;
  const newQuantity = parseInt(req.body.newQuantity);

  try {
    const product = await Product.findById(productId);
    const user = await User.findById(userId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    let priceToUse = product.offerPrice || product.price; 

    if (newQuantity > product.stock) {
      return res.status(400).json({
        error: "Requested quantity exceeds available stock",
        allowed: false,
      });
    }

    const existingCartItemIndex = user.cart.findIndex((cartItem) =>
      cartItem.product.equals(productId)
    );

    if (existingCartItemIndex !== -1) {
      user.cart[existingCartItemIndex].quantity = newQuantity;
      user.cart[existingCartItemIndex].total = newQuantity * priceToUse;
      user.cart[existingCartItemIndex].subtotal = newQuantity * priceToUse;
    } else {
      user.cart.push({
        product: productId,
        quantity: newQuantity,
        total: newQuantity * priceToUse,
        subtotal: newQuantity * priceToUse,
      });
    }

    // Calculate total cart amount
    const totalCartAmount = user.cart.reduce(
      (acc, cartItem) => acc + cartItem.total,
      0
    );

    // Update totalCartAmount and save the user
    user.totalCartAmount = totalCartAmount;
    await user.save();

    res.status(200).json({
      message: "Quantity updated successfully",
      allowed: true,
      totalCartAmount,
      cart: user.cart.map((cartItem) => ({
        product: cartItem.product,
        quantity: cartItem.quantity,
        total: cartItem.total,
        subtotal: cartItem.subtotal,
      })),
    });
  } catch (error) {
    console.error("Error updating quantity:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const removeProduct = async (req, res) => {
  const userId = req.session.userId;

  try {
    const productIdToRemove = req.params.productId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const removedCartItem = user.cart.find(
      (item) => item.product.toString() === productIdToRemove
    );

    if (!removedCartItem) {
      return res.status(404).json({ error: "Product not found in the cart" });
    }

    user.totalCartAmount -= removedCartItem.total;

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productIdToRemove
    );

    await user.save();

    res.status(200).json({ message: "Product removed successfully", totalCartAmount: user.totalCartAmount });
  } catch (error) {
    console.error("Error removing product:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  addToCart,
  loadCart,
  updateQuantity,
  removeProduct,
};
