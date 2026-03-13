require('dotenv').config();
const Router = require('express');
const userRouter = Router();
const { userModel } = require('../db');

const jwt = require("jsonwebtoken");
const JWT_USER_PASSWORD = process.env.JWT_USER_PASSWORD;

const z = require("zod");

const bcrypt = require("bcrypt");

userRouter.post("/signup", async function(req, res) {    
    const requiredBody = z.object({
        name: z.string().min(3).max(100),
        email: z.string().min(3).max(100).email(),
        password: z.string().min(3).max(100),
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if(!parsedDataWithSuccess.success){
        return res.json({
            message: "Incorrect message format",
            error: parsedDataWithSuccess.error
        })
    }

    const { email, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 5);
    try{
        await userModel.create({
            email: email,
            password: hashedPassword,
            name: name
        })   
    }
    catch(e){
        return res.status(400).json({
            message: "User already exists"
        })
    }

    res.json({
        message: "Signup succeeded"
    }) 
})

userRouter.post("/signin",async function(req, res) {
    const requiredBody = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    
    if(!parsedDataWithSuccess.success){
        res.json({
            message: "Invalid input format",
            error: parsedDataWithSuccess.error
        })
    }
    const { email, password } = req.body;

    const user = await userModel.findOne({
        email: email
    });

    if (!user){
        return res.status(403).json({
            message: "Incorrect Credentials"
        })
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if(passwordMatch){
        const token = jwt.sign({
            id: user._id,
        }, JWT_USER_PASSWORD)

        res.json({
            token: token
        })
    }
    else {
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
})

module.exports={
    userRouter
};