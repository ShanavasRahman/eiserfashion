const User=require("../../model/userModel")




const is_blocked = async (req, res, next) => {
    try {
      // Assuming you have the user ID stored in the session or token
      const userId = req.session.userId; 
      const user = await User.findById(userId);
  
      if (user && user.is_blocked) {
        // If the user is blocked, render the login page with a message
        return res.render('user/login', { message: "Your account has been blocked." });
      }
  
      next();
    } catch (error) {
      console.error('Error checking blocked status', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
  
const checkVerification = async (req, res, next) => {
  try {
      // Assuming you have the user ID stored in the session or token
      const userId = req.session.userId;
      const user = await User.findById(userId);

      if (!user || !user.is_verified) {
          // If the user is not found or not verified, render the login page with a message
          return res.render('user/login');
      }

      // If user is verified, proceed to the next middleware
      next();
  } catch (error) {
      console.error('Error checking verification status', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

  
module.exports = {
  is_blocked,
  checkVerification
}