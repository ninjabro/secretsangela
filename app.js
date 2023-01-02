//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const { default: mongoose } = require("mongoose");
const mongoose = require ("mongoose");
const encrypt = require("mongoose-encryption");


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
const secret='ourlittlesecret.';
userSchema.plugin(encrypt, { secret: secret,encryptedFields: ['password']});


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
   const newUser = new User({
    email: req.body.username,
    password: req.body.password
   });
   newUser.save((err)=>{
       if (err){
        console.log(err);
       } else{
        res.render("secrets")
       }
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
       if (foundUser.password === password) {
        res.render('secrets');
      }
      }
    }
  });
});

app.listen(port, () => {
  console.log(`server on ${port}`);
});


