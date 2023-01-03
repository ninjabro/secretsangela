//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const { default: mongoose } = require("mongoose");
const mongoose = require ("mongoose");
// const encrypt = require("mongoose-encryption");

// bcrypt used for salting and hasing
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

// using md5 for hasing 
// const md5 = require("md5");




mongoose.set('strictQuery', false);

const app = express();

const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDb',{useNewUrlParser:true});



const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// important to put mongoose userschema plugin above the model
// using hashing md5 so its commmented
// const secret =(process.env.SECRET);
// userSchema.plugin(encrypt, { secret: secret,encryptedFields: ['password']});


const User = new mongoose.model("User", userSchema);

app.get("/", (req,res)=>{
    res.render("home");
});


app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
     });

   
   newUser.save((err)=>{
       if (err){
        console.log(err);
       } else{
        res.render("secrets")
       }
   });
});
});

app.post("/login", (req, res)=>{

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username}, (err,foundUser)=>{
    if(err){
      console.log(err);
    } else {
      if (foundUser){
        bcrypt.compare(password, foundUser.password, function(err, result) {
         if (result === true){res.render('secrets');}
      }); 
      }
    }
  });
});

app.listen(port, () => {
  console.log(`server on ${port}`);
});


