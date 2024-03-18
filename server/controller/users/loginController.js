const User = require('../../model/userModel');
const OTP = require('../../model/otpVerification');
const bcrypt = require('bcrypt')
const randomstring = require('randomstring');
const transporter = require('../../../config/nodemailer');



const verifyLogin = async (req, res) => {
    const { email, password } = req.body; 

    try {
        const user = await User.findOne({ email });
        if (user) {
            if (await bcrypt.compare(password, user.password) && user.is_admin===0) {
                user.is_verified = true;
                req.session.userId = user.id;
                res.redirect('/home');

            } else {
                // Failed login
                res.render("user/login",{message:"Incorrect Password"});
            }
        } else {
            // User not found
            res.render("user/login",{message:"You dont have any account. Please SignUp!!"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const insertUser = async (req, res) => {
    try {

        const existingEmail = await User.findOne({ email: req.body.email })

        if (existingEmail) return res.render("user/signup", { error: "Email already exists" });

        if (!req.body.mobile) return res.render("user/signup", { error: "mobile no should be filled" })

        if (!req.body.password) return res.render("user/signup", { error: "password should be filled" })

        // Generate raw OTP
        const rawOTP = randomstring.generate({ length: 4, charset: 'numeric' });

        // Hash the OTP before storing it in the database
        const hashedOTP = await bcrypt.hash(rawOTP, 10);

        // Generate OTP with expiry time (1 minute)
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 1); // Expiry time is 1 minute from now

        req.session.tempUserDetails = {
            name: req.body.username,
            email: req.body.email,
            mobile: req.body.mobile,
            password: await bcrypt.hash(req.body.password, 10),
            rawOTP: rawOTP,
            hashedOTP: hashedOTP,
            otpExpiry: otpExpiry,
        };

        // Send raw OTP to the user's email
        sendOTPEmail(req.body.email, rawOTP, req.body.username);

        // Render the 'user/otp' template and pass the email
        res.render('user/otp', { email: req.body.email });
    } catch (e) {
        console.log(e);
        res.redirect('/signup');
    }
};

const sendOTPEmail = (email, otp,name) => {
    // Set up nodemailer transporter (you need to configure this)
 

    // Send OTP to user's email
    transporter.sendMail({
        to: email,
        subject: 'OTP Verification',
        text: `Dear ${name},

        Thank you for choosing Eiser-The complete fashion. To ensure the security of your account, we require you to complete the OTP (One-Time Password) verification process.
        
        Your OTP: ${otp}
        
        Please enter this code on the verification page to complete the process. Note that the OTP is valid for a limited time.
        
        If you didn't request this OTP, please contact our support team immediately.
        
        Best regards,
        Team-Eiser`,
    });
};
const resendOTP = async (req, res) => {
    try {
        console.log(req.body)
        const userId = req.body.userId; // Assuming you pass userId as a parameter

        // Retrieve the user from the database based on the userId
        const user = await User.findOne({ userId: userId });
        console.log(user);
        if (!user) {
            console.log('error', 'User not found');
            return res.redirect('/signup'); // or handle the error accordingly
        }

        // Generate new raw OTP
        const newRawOTP = randomstring.generate({ length: 4, charset: 'numeric' });

        // Hash the new OTP before storing it in the database
        const newHashedOTP = await bcrypt.hash(newRawOTP, 10);

        // Update user's OTP and OTP expiry
        

        await user.save();

        // Send the new OTP to the user's email
        sendOTPEmail(user.email, newRawOTP, user.name);

        console.log('success', 'New OTP sent successfully. Check your email.');
        res.render('user/otp', { userId: user.id, email: '' });
    } catch (e) {
        console.log(e);
        res.redirect('/signup');
    }
};

const verifyOTP = async (req, res) => {
    try {
        console.log(req.body);
        const { email, value } = req.body;

        // Check if the 'value' property is defined
        if (!value || !Array.isArray(value)) {
            console.log('error', 'Invalid OTP format');
            return res.redirect('/signup'); // or handle the error accordingly
        }

        // Convert the array of OTP digits to a string
        const otp = value.join('');
        console.log(email,otp)
        // Retrieve user details from the session
        const tempUserDetails = req.session.tempUserDetails;
        console.log(tempUserDetails);
        // Check if the email from the session matches the submitted email
        if (tempUserDetails && tempUserDetails.email === email) {
            // Check if OTP is valid
            const isOTPValid = await bcrypt.compare(otp, tempUserDetails.hashedOTP);

            if (isOTPValid ) {
                // OTP is valid, save the user details to the database
                const newUser = new User({
                    name: tempUserDetails.name,
                    email: tempUserDetails.email,
                    mobile: tempUserDetails.mobile,
                    password: tempUserDetails.password,
                    is_verified: true
                });

                await newUser.save();

                const otp = new OTP({
                    email: tempUserDetails.email,
                    otp: tempUserDetails.hashedOTP,
                    expiry: tempUserDetails.otpExpiry,
                });
                await otp.save();

                // Redirect to a success page or perform additional actions
                console.log('success', 'User registered successfully');
                res.redirect('/home');
            } else {
                console.log('error', 'Invalid OTP or OTP expired');
                res.render('user/otp', { error: 'Invalid OTP', email: email });
            }
        } else {
            console.log('error', 'User details not found in the session');
            res.redirect('/signup'); // or handle the error accordingly
        }
    } catch (e) {
        console.log(e);
        res.redirect('/signup');
    }
};






const userLogout = async (req, res) => {
    try {
        // Assuming you have the user ID stored in the session
        const userId = req.session.userId;

        // Find the user by ID and update is_verified to false
        await User.findByIdAndUpdate(userId, { is_verified: false });

        // Destroy the session
        req.session.destroy();

        // Redirect to the login page
        res.redirect('/login');
    } catch (error) {
        res.render("error/internalError", { error });
    }
};

const loadOtp = async (req, res) => {
    try {
        res.render("user/otp");
    } catch (error) {
        console.log(error)

    }
};




const loadLogin = async (req, res) => {

    try {

        res.set('Cache-Control', 'no-store')
        res.render("user/login");

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadSignup = async (req, res) => {
    try {
        res.render("user/signup");
    } catch (error) {
        console.log(error)
    }
}

const loadHome= async (req, res) => {
    try {
        res.render("user/index",{isUserLoggedIn});
    } catch (error) {
        console.log(error)
    }
}






module.exports = {
    insertUser,
    loadLogin,
    loadSignup,
    verifyLogin,
    loadHome,
    userLogout,
    loadOtp,
    verifyOTP,
    resendOTP,
  
};  