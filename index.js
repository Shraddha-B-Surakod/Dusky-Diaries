import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import multer from "multer";
import path from "path";

const posts = require("./posts.json"); // Use require instead of import
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage: storage });

// Home route
app.get("/", (req, res) => {
    res.render("index.ejs", { posts: posts });
});

// New post page
app.get("/newpost", (req, res) => {
    res.render("newPost.ejs");
});

// Handle new post submission with file upload
app.post("/new", upload.single("postFile"), (req, res) => {
    let newpost = {
        id: posts.length + 1,
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        file: req.file ? req.file.filename : null, // Store filename if uploaded
    };

    posts.push(newpost);

    fs.writeFile("./posts.json", JSON.stringify(posts, null, 4), (err) => {
        if (err) {
            console.error("Error writing file:", err);
            res.status(500).send("Error saving post.");
        } else {
            console.log("Post added successfully!");
            res.redirect("/");
        }
    });
});

app.get("/viewpost/:id", (req, res) => {
    let postId = parseInt(req.params.id);
    fs.readFile("./posts.json", "utf-8", (err, data) => {
        if (err) {
            res.send("An error occured opening the file.");
        }

        let posts = JSON.parse(data);
        let post = posts.find((p) => p.id === postId);
        res.render("viewPost.ejs", { post: post });
    });
});

// Edit post page
app.get("/editpost/:id", (req, res) => {
    let theid = parseInt(req.params.id);
    let post = posts.find((p) => p.id === theid);
    res.render("editPost.ejs", { post: post });
});

// Handle edit post
app.post("/edit/:id", upload.single("postFile"), (req, res) => {
    let postID = parseInt(req.params.id);
    let postIndex = posts.findIndex((p) => p.id === postID);

    if (postIndex === -1) {
        return res.status(404).send("Post not found.");
    }

    posts[postIndex] = {
        id: postID,
        title: req.body.title || posts[postIndex].title,
        content: req.body.content || posts[postIndex].content,
        author: req.body.author || posts[postIndex].author,
    };

    fs.writeFile("./posts.json", JSON.stringify(posts, null, 4), (err) => {
        if (err) {
            console.error("Error writing file:", err);
            return res.status(500).send("Error saving post.");
        }
        console.log("Post updated successfully!");
        res.redirect("/");
    });
});

// Delete post confirmation page
app.get("/delete/:id", (req, res) => {
    let theid = parseInt(req.params.id);
    let post = posts.find((p) => p.id === theid);
    res.render("deletePost.ejs", { post: post });
});

// Handle delete post
app.post("/delete/:id", (req, res) => {
    let postID = parseInt(req.params.id);
    let password = req.body.password;

    if (password !== "the password without spaces") {
        return res.send("Wrong password!!");
    }

    let postIndex = posts.findIndex((p) => p.id === postID);
    if (postIndex === -1) {
        return res.status(404).send("Post not found.");
    }

    // Remove the file if it exists
    if (posts[postIndex].file) {
        fs.unlink(`./uploads/${posts[postIndex].file}`, (err) => {
            if (err) console.error("Error deleting file:", err);
        });
    }

    posts.splice(postIndex, 1);

    fs.writeFile("./posts.json", JSON.stringify(posts, null, 4), (err) => {
        if (err) {
            console.error("Error writing file:", err);
            return res.status(500).send("Error saving changes.");
        }
        console.log("Post deleted successfully!");
        res.redirect("/");
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
