import express from "express";
import bodyParser from "body-parser";
import { db } from "./db_config.js";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

db.connect();

async function getItems() {
    // Gets all items from  the database
    const result = await db.query("SELECT * FROM books INNER JOIN notes ON books.id = notes.book_id;");
    console.log(result.rows);
    return result.rows;
  };

// Handles logic for landing page
app.get("/", async (req, res) => {
    getItems();
    res.render("index.ejs");
});

// Activates the port
app.listen(port, () => {
    console.log("Server running on port: " + port);
});