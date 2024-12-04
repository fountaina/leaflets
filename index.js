import express from "express";
import bodyParser from "body-parser";
import { db } from "./db_config.js";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Handles logic for landing page
app.get("/", async (req, res) => {
    res.render("index.ejs");
});

// Activates the port
app.listen(port, () => {
    console.log("Server running on port: " + port);
});