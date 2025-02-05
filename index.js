import express from "express";
import bodyParser from "body-parser";
import { db } from "./db_config.js";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

db.connect();

async function getBooks() {
    // Gets all the books stored in the db
    const result = await db.query("SELECT * FROM books");
    let books = [];
    result.rows.forEach((book) => {
        books.push(book);
    });
    console.log(books);
    return books;
  };

async function getNotes(bookId) {
    // Gets all the notes for each book stored in db with the book name included
    const result = await db.query("SELECT notes.id, note, book_name, book_id FROM books INNER JOIN notes ON books.id = notes.book_id WHERE book_id=$1", [bookId]);

    const notes = [];
    result.rows.forEach((note) => {
        notes.push(note);
    });
    console.log(notes);
    return notes;
};

// Handles logic for landing page
// Displays all the Books entered in the database
app.get("/", async (req, res) => {
    try {
        const availableBooks = await getBooks();
        res.render("index.ejs", {books: availableBooks});
    } catch (error) {
        console.error("Error fetching books", error);
        res.status(500).send("Error fetching Books!");
    }
});

// Handles the logic for displaying the notes of each book
app.get("/books", async (req, res) => {
    const bookId = req.query.id;
    try {
        const notes = await getNotes(bookId);
        res.render("notes.ejs", {notes: notes, bookId: bookId});
    } catch (error) {
        console.error("Error fetching notes", error);
        res.status(500).send("Error fetching Notes!");
    }

});

// Displays the form page to add new book
app.get("/newbook", async (req, res) => {
    res.render("newbook.ejs");
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
    console.log(typeof(req.body.noteId));
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

// Activates the port
app.listen(port, () => {
    console.log("Server running on port: " + port);
});