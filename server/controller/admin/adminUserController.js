const user = require('../../model/userModel');
const bcrypt = require('bcrypt');



const createAdminUser = async () => {
    const adminData = {
        name: 'admin',
        email: 'admin@gmail.com',
        mobile: '8075488368',
        password: await bcrypt.hash('admin123', 10), // Hash the password
        is_admin: 1,
        is_verified: 1, // You might want to set this to 1 if the admin user is always verified
    };

    try {
        const adminUser = new admin(adminData);
        await adminUser.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// // Uncomment the line below and run the script to create the admin user
// // createAdminUser();

const loadusers = async (req, res) => {
    try {
      const users = await user.find();
  
      if (users.length > 0) {
        // Check if there is at least one non-admin user
        const nonAdminUsers = users.filter(user => user.is_admin === 0);
  
        if (nonAdminUsers.length > 0) {
          // Check the is_blocked status for each user
          const usersWithStatus = nonAdminUsers.map(user => {
            const status = user.is_blocked ? 'Blocked' : 'Active';
            
            return { ...user._doc, status};
          });
  
          res.render("admin/users", { users: usersWithStatus, message: null,req });
        } else {
          res.render("admin/users", { users: [], message: 'No users found!!!' });
        }
      } else {
        res.render("admin/users", { users: [], message: 'No users found!!!' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
    
  
    const blockUser=async (req, res) => {
      try {
        // Retrieve user ID from the request body
          const userId = req.body.userId;
          console.log(userId);
         // Retrieve the current user document
      const currentUser = await user.findById(userId);
  
      // Check if the user exists
      if (!currentUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
  
      // Toggle the value of is_blocked
      const newIsBlockedValue = !currentUser.is_blocked;
  
      // Update the user's is_blocked field
      await user.findByIdAndUpdate(userId, { $set: { is_blocked: newIsBlockedValue } });
  
      // Respond with a success message and the updated value of is_blocked
      res.json({ success: true, isBlocked: newIsBlockedValue });
    } catch (error) {
      console.error('Error blocking/unblocking user', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
  
module.exports = {
    loadusers,
    blockUser
}
  