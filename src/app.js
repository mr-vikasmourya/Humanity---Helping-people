require('dotenv').config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = express(); 
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
 

require("./db/conn")
const Register = require("./models/registers")

const port = process.env.PORT || 3000;
 
const static_path = path.join(__dirname,"../public")

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({extended:false}));
app.use(express.static(static_path));
  
// console.log(process.env.SECRET_KEY);
app.get("/",(req,res)=>{
    res.send("index.html")
});

app.get("/donate",(req,res)=>{
    res.redirect("donate.html")
})

// for Security we use (auth)
// app.get("/blog",auth,(req,res)=>{
//     // console.log(`This is cookie ${req.cookies.jwt}`); 
//     res.redirect("blog.html")
// }) 

app.get("/blog",(req,res)=>{
    // console.log(`This is cookie ${req.cookies.jwt}`); 
    res.redirect("blog.html")
}) 

app.get("/logout",auth,async(req,res)=>{
    try {
        console.log(req.user);

        // for single device logout
        // req.user.tokens = req.user.tokens.filter((currElement)=>{
        //     return currElement.token != req.token
        // })

        // logOut from all devices
        req.user.tokens = [];

        res.clearCookie("jwt");
        console.log("logout Succesfully");

        await req.user.save(); 
        res.redirect("login.html");
    } catch (error) {
        res.status(500).send(error)
    }
})

// login check 
app.get("/login",(req,res)=>{
    res.redirect("login.html")
})

app.post("/login",async(req,res)=>{
    try {
        const email = req.body.email; 
        const password = req.body.password;

        const useremail= await Register.findOne({email:email});
        
        const isMatch = await bcrypt.compare(password, useremail.password);
        // useremail.password === password

        const token = await useremail.generateAuthToken();
        // console.log("the token part in login " + token);

        res.cookie("jwt",token,{ 
            expires:new Date(Date.now() + 600000),
            httpOnly:true,
            // secure:true // https only for secure connection
        }); 
 

        if(isMatch){
            res.status(201).redirect("/index.html");
        }else{
            res.send("Invalid Login Details");
        }

    } catch (error) {
        res.status(400).send("Invalid Email")
    }
})


//create a new user
app.post("/register", async (req,res) =>{
    try {
        
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if(password === cpassword){

            const registerUser = new Register({
                name : req.body.name,
                email : req.body.email,
                password : password, 
                confirmpassword : cpassword
            }) 

            console.log("the success part " + registerUser);
             const token = await registerUser.generateAuthToken();

            const registered = await registerUser.save();
            console.log("the page part " + registered);

            res.status(201).redirect("index.html");

        }else{ 
            res.send("password are not matching");
        }

    } catch (error) {
        res.status(400).send(error)
        console.log("the error part page");
    }
})



app.listen(port,()=>{
    console.log(`server is running at port no ${port}`);
})