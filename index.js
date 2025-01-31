import express from "express";
import bodyParser from "body-parser";
import { db } from "./db_config.js";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

db.connect();

async function getBooks() {
    // Gets all items from  the database
    const result = await db.query("SELECT book_name FROM books");
    let books = [];
    result.rows.forEach((book) => {
        books.push(book.book_name);
    });
    console.log(books);
    return books;
  };

// Handles logic for landing page
app.get("/", async (req, res) => {
    try {
        const availableBooks = await getBooks();
        res.render("index.ejs", {books: availableBooks});
    } catch (error) {
        console.error("Error fetching books", error);
        res.status(500).send("Error fetching Books!");
    }
});

// Activates the port
app.listen(port, () => {
    console.log("Server running on port: " + port);
});