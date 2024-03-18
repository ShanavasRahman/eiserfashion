const User = require("../../model/userModel");

const Address = require("../../model/addressModel");

const mongoose = require("mongoose");

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log("hello");
        const user = await User.findOne({ _id: userId });
        const addresses = await Address.find({ userId: userId });

        console.log(addresses);
      
        res.render('user/profile', { user, addresses });
     

      
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
}
  
const addAddress = async (req, res) => {
    try {
        // Create a new Address document
        const newAddress = new Address({
            userId: req.session.userId,
            name: req.body.name,
            mobile: req.body.mobile,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            locality: req.body.locality,
            pincode: req.body.pincode,
            address: req.body.address,
            default: false, // Set default to false, you may adjust this based on your logic
        });
  
        // Save the new address to the database
        const savedAddress = await newAddress.save();
  
        // Respond with the saved address
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const updateAddress = async (req, res) => {
  const addressId = req.body.id;
  console.log(req.body);
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      { _id: addressId },
      { $set: req.body },
      { new: true, useFindAndModify: false }
  );

    // Check if the update was successful
    if (updatedAddress) {
      res.redirect('/profile');
    } else {
      res.status(404).send('Address not found');
    }
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).send('Internal Server Error');
  }
};

const deleteAddress=async (req, res) => {
  const addressId = req.body.id;

  try {
      // Assuming you have a method to delete the address by ID in your model
      const deletedAddress = await Address.findByIdAndDelete(addressId);

      if (deletedAddress) {
          res.json({ success: true, message: 'Address deleted successfully.' });
      } else {
          res.json({ success: false, message: 'Address not found.' });
      }
  } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}


  



module.exports = {
  loadProfile,
  addAddress,
  updateAddress,
  deleteAddress
};