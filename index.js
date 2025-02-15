import express from "express";
import bodyParser from "body-parser";
import { db } from "./db_config.js";
import session from "express-session";
import passport from "passport";
import env from "dotenv";
import bcrypt from "bcrypt";
import {Strategy} from "passport-local";

const app = express();
const port = 3000;
env.config();

const saltRounds = 10;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60*24,
    }
}));

//Initialize passport module
app.use(passport.initialize());
app.use(passport.session());


db.connect();

async function getUserBooks(userId) {
    // Gets all the books stored in the db
    // const result = await db.query(
    //     "SELECT * FROM books"
    // );
    const result = await db.query(
        "SELECT books.id, users.username, users.full_name, books.book_name, books.author FROM users JOIN books ON users.id = books.user_id WHERE users.id = $1;",
        [userId]
    );
    let books = [];
    result.rows.forEach((book) => {
        books.push(book);
    });
    // console.log(books);
    return books;
  };

async function getNotes(bookId) {
    // Gets all the notes for each book stored in db with the book name included
    const result = await db.query(
        "SELECT notes.id, note, book_name, book_id FROM books INNER JOIN notes ON books.id = notes.book_id WHERE book_id=$1", [bookId]
    );

    const notes = [];
    result.rows.forEach((note) => {
        notes.push(note);
    });
    // console.log(notes);
    return notes;
};

// Handles logic for landing page
// Displays all the Books entered in the database
app.get("/", async (req, res) => {
    console.log("The user: " + JSON.stringify(req.user));
    if (req.isAuthenticated()) {
        try {
            const availableBooks = await getUserBooks(req.user.id);
            res.render("index.ejs", {books: availableBooks});
        } catch (error) {
            console.error("Error fetching books", error);
            res.status(500).send("Error fetching Books!");
        }
    } else {
        res.redirect("/login");
    }
});

// Handles the logic for displaying the notes of each book
app.get("/books", async (req, res) => {
    const bookId = req.query.id;
    try {
        const notes = await getNotes(bookId);
        // res.render("notes.ejs", {notes: notes, bookId: bookId});
        res.render("notes_new.ejs", {notes: notes, bookId: bookId});
    } catch (error) {
        console.error("Error fetching notes", error);
        res.status(500).send("Error fetching Notes!");
    }

});

// Displays the form page to add new book
app.get("/newbook", async (req, res) => {
    if (req.isAuthenticated) {
        res.render("newbook.ejs");
    } else {
        res.redirect("/register");
    }
});

//Displays the login page
app.get("/login", async(req, res) => {
    res.render("login.ejs");
})

//Logs user out of authenticated session.
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        } else {
            res.redirect("/");
        }
    })
})

//Displays the page for registering new account
app.get("/register", async(req, res) => {
    res.render("register.ejs");
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}));


//Handles logic for resgistering a new account
app.post("/register", async(req, res) => {
    function capitalizeName(str) {
        return str.split(" ")
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ");
    }

    const fullName = capitalizeName(req.body.full_name);
    const username = req.body.username;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, async(err, hash) => {
        if(err) {
            console.error("Error encrypting password: " + err);
        } else {
            try {
                await db.query(
                    "INSERT INTO users (username, password, full_name) VALUES($1, $2, $3)", 
                    [username, hash, fullName]
                );
                res.redirect("/login");
            } catch (error) {
                console.error("Error registering user: " + error);
            }
        }
    });
});

// Handles logic for adding new book to the db
app.post("/addbook", async(req, res) => {
    const bookName = req.body.book_name;
    const bookAuthor = req.body.author;

    try {
        db.query("INSERT INTO books (book_name, author) VALUES ($1, $2)", [bookName, bookAuthor])
    } catch (error) {
        console.error("Error adding book: " + error);
        res.status(500).send("Error occured while adding new book");
    }
    res.redirect("/");
});

// Handle logic that adds new notes into the db
app.post("/addnote", async(req, res) => {
    const note = req.body.note;
    const bookId = req.body.book_id;

    try {
        db.query("INSERT INTO notes (note, book_id) VALUES ($1, $2)", [note, bookId]);
    } catch (error) {
        console.error("Error adding new note: " + error);
        res.status(500).send("Error adding new note!");
    }

    res.redirect(`/books?id=${bookId}`);
});

// Handles the logic for the deletion of notes.
app.post("/delete_note", async(req, res) => {
    const noteId = req.body.note_id;
    const bookId = req.body.book_id;

    try {
        db.query("DELETE FROM notes WHERE notes.id=$1", [noteId]);
        res.redirect(`/books?id=${bookId}`);
    } catch (error) {
        console.error("Error deleting note: " + error);
        res.status(500);
    }
});

app.post("/edit_note", async(req, res) => {
    const editedNote = req.body.editedNote;
    const noteId = req.body.noteId;
    const bookId = req.body.bookId;
    
    try {
        db.query("UPDATE notes SET note=$1 WHERE id=$2", [editedNote, noteId]);
        res.redirect(`/books?id=${bookId}`);
    } catch (error) {
        console.error("Error editing this note: " + error);
        res.status(500);
    }

});

passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
        try {
            const result = await db.query(
                "SELECT * FROM users WHERE username=$1", [username]
            )
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        return cb(err);
                      } else {
                        if (valid) {
                          return cb(null, user);
                        } else {
                          return cb(null, false);
                        }
                    }
                });
            } else {
                return cb("User not found!");
            }
        } catch (error) {
            console.log(err);
        }
    })
);

//serialize and deserialize user
passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
})

// Activates the port
app.listen(port, () => {
    console.log("Server running on port: " + port);
});