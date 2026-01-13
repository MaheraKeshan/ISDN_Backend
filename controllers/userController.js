import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";    
import axios from 'axios';
import nodemailer from "nodemailer";
import OTP from "../models/otp.js";

// ✅ MODIFIED: Protected RDC Staff & Logistics creation
export function createUser(req, res) {
    // Check if the requested role is a restricted role (Admin, RDC Staff, or Logistics)
    if (req.body.role == "admin" || req.body.role == "rdc_staff" || req.body.role == "logistics") {  
        if (req.user != null) {
            if (req.user.role != "admin") {
                res.status(403).json({
                    message: "You are not authorized to create this type of user"
                });
                return;
            }
        } else {
            res.status(403).json({
                message: "You are not authorized to create this user, Please login as Admin first"
            });
            return;
        }
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role, // This will now safely accept 'rdc_staff' if authorized
    });

    user.save()
        .then(() => {
            res.json({
                message: "User created successfully",
            });
        })
        .catch((error) => { // Added error parameter for better debugging if needed
            res.json({
                message: "User creation failed",
                error: error.message
            });
        });
}

// --- ALL FUNCTIONS BELOW REMAIN UNCHANGED ---

export function loginUser(req, res) {
    const email = req.body.email
    const password = req.body.password

    User.findOne({email: email}).then((user) => {
        console.log(user)
        if(user == null) {
            res.status(404).json({
                message: "User not found"
            })
        }else{
            const isPasswordCorrect = bcrypt.compareSync(password, user.password)
            if(isPasswordCorrect) {
                const token = jwt.sign(
                    {email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    img : user.img
                },  
                process.env.JWT_KEY,
                )

                res.json({
                    message: "Login successful",
                    token : token,
                    role: user.role,
                })
            }else{
                res.status(401).json({
                    message: "Login failed"
                })
            }
        }
    })
}

export async function googleLogin(req,res){
    const token = req.body.accessToken;
  if(token == null){
    res.status(400).json({
      message: "Token is required"
    })
    return;
  }
  
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',{
      headers: {
        Authorization: `Bearer ${token}`
      }

    })
    console.log(response.data);

    const user = await User.findOne({email: response.data.email});
    if(user == null) {
        //create new user
        const newUser = new User({   
            email: response.data.email,
            firstName: response.data.given_name,
            lastName: response.data.family_name,
            password: "googleUser",
            img: response.data.picture
        })
        await newUser.save();
        const token = jwt.sign(
            {email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            img : newUser.img
        },
    process.env.JWT_KEY,
        )

        res.json({
            message: "User created successfully",
            token : token,
            role: newUser.role,
        })
    }else {
        const token = jwt.sign(
            {email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            img : user.img
        },
        process.env.JWT_KEY,
        )
        res.json({
            message: "Login successful",
            token : token,
            role: user.role,
        })
    }
}

const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "maherakeshan90@gmail.com",
        pass: "iqmsskqwkwjnwhcf",
    }
});        

export async function sendOTP(req, res) {
    const randomOTP = Math.floor(100000 + Math.random() * 900000);
    const email = req.body.email;
    if(email == null) {
        res.status(400).json({
            message: "Email is required"
        });
        return;
    }

    const user = await User.findOne({email: email});
    if(user == null) {
        res.status(404).json({
            message: "User not found"
        });
    }

    await OTP.deleteMany({email: email});

    const otp = new OTP({
        email: email,
        otp: randomOTP
    });
    await otp.save();

    const message = {
        from: "maherakeshan90@gmail.com",
        to: email,
        subject: "Resetting password for ISDN Distribution",
        text: "Your OTP code is: "+ randomOTP
    }

    transport.sendMail(
        message, (error, info) => {
        if (error) {
            res.status(500).json({
                message: "Failed to send OTP"
            });
        } else {
            res.json({
                message: "OTP sent successfully",
                otp: randomOTP 
            }); 
        }
    });
}

export async function resetPassword(req, res) {
    const email = req.body.email;
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;
    console.log(otp)
    const response = await OTP.findOne({ email: email, otp: otp });
    
    if (response == null) {
        res.status(500).json({ 
            message: "No OTP request found please try again" 
        });
        return
    }
    if (response.otp == otp) {
        await OTP.deleteMany({ email: email });

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const response2 = User.updateOne(
            { email: email },
            { password: hashedPassword } 
        );  
        res.json({
            message: "Password reset successfully"
        });
    }else {
        res.status(403).json({ message: "OTPs do not match" });
    }
}

export function getUser(req,res){
    if(req.user == null){
        res.status(403).json({
            message: "You are not authorized to view user details"
        })
        return
    }else{
        res.json({
            ...req.user
        })
    }
}

export async function getUsers(req, res) {
  if (!isAdmin(req, res)) {
    return res.status(403).json({
      message: "You must be an admin to view all users"
    });
  }

  try {
    const users = await User.find({}, { password: 0 }); 
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
}

export function isAdmin(req, res) {
    if(req.user == null){
        return false
    }
            
    if(req.user.role != "admin"){
        return false
    }
    return true 
}    

export async function deleteUser(req, res) {
  if (!isAdmin(req, res)) {
    return res.status(403).json({
      message: "You are not authorized to delete users"
    });
  }

  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user"
    });
  }
}