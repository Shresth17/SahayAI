const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { setUser, getUser } = require('../authservice');
const { checkLogin } = require('../middlewares/auth');



router.post('/signup', async (req, res) => {
    try {
        const hashPassword = bcrypt.hashSync(req.body.password, 10);
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
            gender: req.body.gender,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode
        });

        const savedUser = await user.save();
        return res.status(200).json(savedUser);
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ 
            message: "Internal server error during signup", 
            error: error.message 
        });
    }
})

router.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({email});
        
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        
        const validPassword = bcrypt.compareSync(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).json({message: "Invalid Password"});
        }
        
        const token = setUser(user);
        res.cookie("token", token, {
            httpOnly: false, // Prevents frontend JavaScript access
            secure: true,  // Must be true in production (HTTPS)
            sameSite: "None", // Required for cross-origin requests
            path: "/", // Ensure it's accessible site-wide
            maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
        });
        
        return res.status(200).json({token});
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ 
            message: "Internal server error during login", 
            error: error.message 
        });
    }
})

router.get('/token/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const user = getUser(token);
        
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        
        return res.status(200).json(user.user);
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({ 
            message: "Internal server error during token verification", 
            error: error.message 
        });
    }
})

router.get("/logout", async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true, // Ensure this matches your original cookie settings
            secure: true,
            sameSite: "None",
            path: "/"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ 
            message: "Internal server error during logout", 
            error: error.message 
        });
    }
})

router.put("/profileUpdate", checkLogin, async (req, res) => {
    try {
        // Extract user ID from token (checkLogin middleware sets `req.user`)
        const userId = req.user.user._id;

        // Extract profile update data from request body
        const { name, gender, state, district, pincode, address, mobile } = req.body;

        // Find the user and update details
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { name, gender, state, district, pincode, address, phone: mobile }, // Update fields
            { new: true, runValidators: true } // Return updated user & validate data
        );

        if (!updatedUser) {
            console.log("User not found!");
            return res.status(404).json({ message: "User not found" });
        }
        const token =  setUser(updatedUser);
    res.cookie("token", token, {
        httpOnly: false, // Security: prevents frontend JavaScript access
        secure: true, // Must be true in production with HTTPS
        sameSite: "None", // Required for cross-origin requests
        path: "/", // Ensure it's accessible site-wide
    });

        console.log("Updated User:", updatedUser);
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Server error", error });
    }
});



router.get("/username", checkLogin, async (req, res) => {
    try {
        const user = req.user.user;
        
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        
        return res.status(200).json(user);
    } catch (error) {
        console.error("Username fetch error:", error);
        return res.status(500).json({ 
            message: "Internal server error while fetching username", 
            error: error.message 
        });
    }
})

router.get('/allusers/contact', async (req, res) => {
    try {
        const users = await User.find({});
        return res.status(200).json(users);
    } catch (error) {
        console.error("Fetch all users error:", error);
        return res.status(500).json({ 
            message: "Internal server error while fetching users", 
            error: error.message 
        });
    }
})

module.exports = router;