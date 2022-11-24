require('dotenv').config()
require("./database/db").connect()
const user = require("./model/user")
const express = require('express')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")

const app = express()

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("<h1>Server is working</h1>")
})

app.post("/register", async (req, res) => {
    try {
        //1. get all data from body
        const {firstname, lastname, email, password} = req.body
        //2. all data should exits
        if ((!firstname && lastname && email && password)) {
            res.status(400).send("All fields are requried")
        }
        //3. check if user already exists - email
        const existingUser =  await user.findOne({ email })
        if (existingUser) {
            res.status(401).send("User Already exists with in the system")
        }
        //4. encrypt the password
        const encryptedPassword = await bcrypt.hash(password, 10)
        //5. save the user in DB
        const user = await user.create({
            firstname,
            lastname,
            email,
            password: encryptedPassword
        })
        //6. generate a token for user and send it 
        const token =jwt.sign(
            {id: user._id, email},
            'shhhh',  //process.env.jwtsecret
            {
                expiresIn: "2h"
            }
        );
        user.token = token
        user.password = undefined
        
        res.status(201).json(user)

    } catch (error) {
        console.log(error);
    }
})

app.post("/login", async (req, res) => {
    try {
        //1. get all data from frontend
        const {email, password} = req.body
        //2. validation
        if (!(email && password)) {
            res.status(400).send('Send Data')
        }
        //3. find user in DB
        const user = await user.findOne({email})
        // If user is not there, then what?
        //4. match the password
        //await bcrypt.compare(password, user.password)
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {id: user._id},
                'shhhh',  //process.env.jwtsecret
                {
                    expiresIn: "2h"
                }
            );
            user.token = token
            user.password = undefined

            //cookie section
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 1000),
            httpOnly: true
        };
        res.status(200).cookie("token", token, options).json({
            succcess: true,
            token,
            user
        })

        }
        //5. send a token
    } catch (error) {
        console.log(error);
    }
})

module.exports = app