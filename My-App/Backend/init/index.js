import mysql from "mysql2";
import express from "express";
// import pkg from "./data.js";


import { data as users } from "./data.js";
import createUsersTable from "../Models/Listing.js";
import createStoresTable from "../Models/Store.js";
import createRatingsTable from "../Models/Rating.js";
  
const app = express();

app.use(express.json());


// ==============================
// DB CONNECTION
// ==============================

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "893100",
  database: "MYAPP"
});

db.connect((err) => {

  if (err) {
    console.log("DB Error", err);
  } else {
    console.log("MySQL Connected");

    // AUTO INSERT START
    seedUsers();
  }

});


// ==============================
// SEED FUNCTION (BULK INSERT)
// ==============================

function seedUsers() {

  const sql = `
    INSERT INTO users
    (name, email, password, address, role)
    VALUES (?, ?, ?, ?, ?)
  `;

  users.forEach((user) => {

    db.query(
      sql,
      [
        user.name,
        user.email,
        user.password,
        user.address,
        user.role
      ],
      (err) => {

        if (err) {
          console.log("Insert Error:", user.email);
        } else {
          console.log("Inserted:", user.name);
        }

      }
    );

  });

}
