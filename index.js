const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Set the views directory
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/newlogin")
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch(error => {
        console.log("MongoDB connection error:", error);
    });

const loginSchema = new mongoose.Schema({
    name: String,
    password: String,
    age: Number,
    email: String
});
const Login = mongoose.model("Login", loginSchema);

app.get("/", (req, res) => {
    res.render("good");
});

app.post("/create", async (req, res) => {
    let { name, password, age, email } = req.body;

    try {
        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create the user in the database
        const userCreate = await Login.create({
            name,
            password: hash,
            age,
            email
        });

        let token = jwt.sign({ email }, "abcgfyrgfgtgdhfrfuf");
        res.cookie("token", token);
        res.send(userCreate);

    } catch (err) {
        console.log("Error creating user", err);
        res.status(500).send("Server error");
    }
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let user = await Login.findOne({ email: req.body.email });
    if (!user) return res.send("User not found");

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: user.email }, "abcgfyrgfgtgdhfrfuf");
            res.cookie("token", token);
            res.send("Login successful");
        } else {
            res.send("Invalid credentials");
        }
    });
});

// Start the server on port 5000
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
