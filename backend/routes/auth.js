const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map();

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP route
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP with expiry
    otpStore.set(email.toLowerCase().trim(), {
      otp,
      expiry: expiryTime,
      attempts: 0
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "EstatePro - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>Thank you for signing up with EstatePro!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${otp}</span>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>EstatePro Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to send OTP",
      error: error.message 
    });
  }
});

// Verify OTP and signup route
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      return res.status(400).json({ 
        message: "Email, OTP, name, and password are required" 
      });
    }

    const emailKey = email.toLowerCase().trim();
    const storedOTP = otpStore.get(emailKey);

    if (!storedOTP) {
      return res.status(400).json({ 
        message: "No verification code found. Please request a new one." 
      });
    }

    // Check if OTP has expired
    if (Date.now() > storedOTP.expiry) {
      otpStore.delete(emailKey);
      return res.status(400).json({ 
        message: "Verification code has expired. Please request a new one." 
      });
    }

    // Check attempts (limit to 3 attempts)
    if (storedOTP.attempts >= 3) {
      otpStore.delete(emailKey);
      return res.status(400).json({ 
        message: "Too many failed attempts. Please request a new verification code." 
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return res.status(400).json({ 
        message: "Invalid verification code" 
      });
    }

    // OTP is correct, proceed with user creation
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: emailKey,
      password: hashedPassword
    });

    // Clean up OTP
    otpStore.delete(emailKey);

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "7d" 
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error during verification", 
      error: error.message 
    });
  }
});

module.exports = router;
