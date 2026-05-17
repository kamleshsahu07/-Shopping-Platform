import express from "express";
import mysql from "mysql2";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import createUsersTable from "./Models/Listing.js";
import createStoresTable from "./Models/Store.js";
import createRatingsTable from "./Models/Rating.js";
import createAdminsTable from "./Models/Admin.js";
import path from "path";

const app = express();
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "strong-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "893100",
  database: "MYAPP",
});

db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log("MySQL Connected");
  createUsersTable(db);
  createStoresTable(db);
  createAdminsTable(db);
  createRatingsTable(db);

  ensureStoreRatingColumn();

  ensureRatingsSchema()
    .then(() => {
      seedDefaultAccounts();
    })
    .catch((e) => {
      console.log("ensureRatingsSchema failed:", e);
      // Still seed so app is usable; but review column might be missing.
      seedDefaultAccounts();
    });
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/.test(password);
}

function validateName(name) {
  return typeof name === "string" && name.trim().length >= 3 && name.trim().length <= 60;
}

function validateAddress(address) {
  return typeof address === "string" && address.trim().length <= 400;
}

function findAuthUserByEmail(email, callback) {
  const sql = `
    SELECT id, name, email, password, address, role
    FROM users
    WHERE email = ?
    UNION ALL
    SELECT id, name, email, password, address, role
    FROM admins
    WHERE email = ?
    LIMIT 1
  `;
  db.query(sql, [email, email], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
}

function findAuthUserById(id, callback) {
  const sql = `
    SELECT id, name, email, password, address, role
    FROM users
    WHERE id = ?
    UNION ALL
    SELECT id, name, email, password, address, role
    FROM admins
    WHERE id = ?
    LIMIT 1
  `;
  db.query(sql, [id, id], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
}

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    findAuthUserByEmail(email, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: "Incorrect email or password." });

      bcrypt.compare(password, user.password, (bcryptErr, matched) => {
        if (bcryptErr) return done(bcryptErr);
        if (!matched) return done(null, false, { message: "Incorrect email or password." });
        return done(null, user);
      });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, { id: user.id, email: user.email, role: user.role });
});

passport.deserializeUser((serialized, done) => {
  if (!serialized || !serialized.id) return done(null, false);
  findAuthUserById(serialized.id, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false);
    done(null, user);
  });
});

function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

function ensureStoreRatingColumn() {
  const checkSql = `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stores'
      AND COLUMN_NAME = 'rating'
  `;

  db.query(checkSql, (err, rows) => {
    if (err) {
      console.log("Failed to check stores table columns:", err);
      return;
    }
    if (rows.length === 0) {
      db.query(`ALTER TABLE stores ADD COLUMN rating INT`, (alterErr) => {
        if (alterErr) {
          console.log("Failed to add rating column to stores table:", alterErr);
        } else {
          console.log("Stores table rating column added");
        }
      });
    } else {
      console.log("Stores table rating column already exists");
    }
  });
}

function ensureRatingsSchema() {
  return new Promise((resolve, reject) => {
    const reviewCheckSql = `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ratings'
        AND COLUMN_NAME = 'review'
    `;

    db.query(reviewCheckSql, (err, rows) => {
      if (err) return reject(err);

      const ensureReview = rows.length > 0
        ? Promise.resolve().then(() => console.log("Ratings table review column already exists"))
        : new Promise((resolveAlter, rejectAlter) => {
            db.query(`ALTER TABLE ratings ADD COLUMN review TEXT`, (alterErr) => {
              if (alterErr) return rejectAlter(alterErr);
              console.log("Ratings table review column added");
              resolveAlter();
            });
          });

      const ensureUnique = new Promise((resolveUnique) => {
        db.query(
          `ALTER TABLE ratings ADD UNIQUE KEY uniq_user_store (user_id, store_id)`,
          (uniqErr) => {
            if (uniqErr) {
              const msg = String(uniqErr.message || uniqErr);
              if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("exists")) {
                console.log("Ratings table uniq_user_store already exists");
                resolveUnique();
              } else {
                console.log("Failed to ensure ratings uniq_user_store:", uniqErr);
                // don't hard-fail app boot
                resolveUnique();
              }
              return;
            }
            console.log("Ratings table uniq_user_store added");
            resolveUnique();
          }
        );
      });

      ensureReview
        .then(() => ensureUnique)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

// Sync admins table from users table (source of truth currently role='ADMIN')
function syncAdminsFromUsers() {
  const sql = `
    INSERT INTO admins (name, email, password, address, created_at)
    SELECT u.name, u.email, u.password, u.address, u.created_at
    FROM users u
    WHERE u.role = 'ADMIN'
      AND NOT EXISTS (
        SELECT 1 FROM admins a WHERE a.email = u.email
      )
  `;
  db.query(sql, (err) => {
    if (err) {
      console.log("syncAdminsFromUsers error:", err);
    } else {
      console.log("syncAdminsFromUsers done");
    }
  });
}

function seedDefaultAccounts() {
  // Check if we should clear all data first
  const clearAndSeed = process.env.CLEAR_AND_SEED === "true";

  if (clearAndSeed) {
    console.log("CLEAR_AND_SEED enabled - Clearing all data...");
    // Delete all ratings first (has foreign keys)
    db.query("DELETE FROM ratings", (err) => {
      if (err) console.log("Error clearing ratings:", err);
      // Delete all stores (has foreign key to users)
      db.query("DELETE FROM stores", (err) => {
        if (err) console.log("Error clearing stores:", err);
        // Delete all users (admins are in users table too based on findAuthUserByEmail)
        db.query("DELETE FROM users", (err) => {
          if (err) console.log("Error clearing users:", err);
          console.log("All data cleared. Now seeding fresh data...");
          insertSeedData();
          setTimeout(syncAdminsFromUsers, 1500);
        });
      });
    });
  } else {
    // Normal seeding - only insert if not exists
    insertSeedData();
    setTimeout(syncAdminsFromUsers, 1500);
  }
}

function insertSeedData() {
  // Define all seed data
  const admins = [
    { name: "Rajesh Kumar", email: "admin1@shopstores.com", password: "Admin@123", address: "Mumbai, Maharashtra", role: "ADMIN" },
    { name: "Priya Sharma", email: "admin2@shopstores.com", password: "Admin@456", address: "Pune, Maharashtra", role: "ADMIN" },
    { name: "Amit Patel", email: "admin3@shopstores.com", password: "Admin@789", address: "Ahmedabad, Gujarat", role: "ADMIN" }
  ];

  const storeOwners = [
    { name: "Sneha Deshmukh", email: "owner1@shopstores.com", password: "Owner@123", address: "Nagpur, Maharashtra", role: "STORE_OWNER" },
    { name: "Vikram Singh", email: "owner2@shopstores.com", password: "Owner@456", address: "Jaipur, Rajasthan", role: "STORE_OWNER" },
    { name: "Anita Kulkarni", email: "owner3@shopstores.com", password: "Owner@789", address: "Kolhapur, Maharashtra", role: "STORE_OWNER" },
    { name: "Rahul Joshi", email: "owner4@shopstores.com", password: "Owner@101", address: "Thane, Maharashtra", role: "STORE_OWNER" },
    { name: "Pooja Shirke", email: "owner5@shopstores.com", password: "Owner@202", address: "Pimpri, Maharashtra", role: "STORE_OWNER" },
    { name: "Amit Borse", email: "owner6@shopstores.com", password: "Owner@303", address: "Hadapsar, Pune", role: "STORE_OWNER" },
    { name: "Neha Darekar", email: "owner7@shopstores.com", password: "Owner@404", address: "Wakad, Pune", role: "STORE_OWNER" },
    { name: "Rohan Bhosale", email: "owner8@shopstores.com", password: "Owner@505", address: "Viman Nagar, Pune", role: "STORE_OWNER" },
    { name: "Swati Jadhav", email: "owner9@shopstores.com", password: "Owner@606", address: "Kothrud, Pune", role: "STORE_OWNER" },
    { name: "Kiran Pawar", email: "owner10@shopstores.com", password: "Owner@707", address: "Aundh, Pune", role: "STORE_OWNER" },
    { name: "Mayuri Patil", email: "owner11@shopstores.com", password: "Owner@808", address: "Baner, Pune", role: "STORE_OWNER" },
    { name: "Sandeep More", email: "owner12@shopstores.com", password: "Owner@909", address: "Hinjewadi, Pune", role: "STORE_OWNER" }
  ];

  const regularUsers = [
    { name: "Pooja Mehta", email: "user1@shopstores.com", password: "User@123", address: "Navi Mumbai, Maharashtra", role: "USER" },
    { name: "Suresh Yadav", email: "user2@shopstores.com", password: "User@456", address: "Aurangabad, Maharashtra", role: "USER" },
    { name: "Neha Gupta", email: "user3@shopstores.com", password: "User@789", address: "Solapur, Maharashtra", role: "USER" },
    { name: "Arjun Reddy", email: "user4@shopstores.com", password: "User@101", address: "Satara, Maharashtra", role: "USER" },
    { name: "Kavita Rao", email: "user5@shopstores.com", password: "User@202", address: "Sangli, Maharashtra", role: "USER" },
    { name: "Manish Kumar", email: "user6@shopstores.com", password: "User@303", address: "Latur, Maharashtra", role: "USER" },
    { name: "Ritu Singh", email: "user7@shopstores.com", password: "User@404", address: "Osmanabad, Maharashtra", role: "USER" },
    { name: "Deepak Patil", email: "user8@shopstores.com", password: "User@505", address: "Beed, Maharashtra", role: "USER" },
    { name: "Sonal Jadhav", email: "user9@shopstores.com", password: "User@606", address: "Parbhani, Maharashtra", role: "USER" },
    { name: "Rohan Desai", email: "user10@shopstores.com", password: "User@707", address: "Hingoli, Maharashtra", role: "USER" },
    { name: "Pallavi Kulkarni", email: "user11@shopstores.com", password: "User@808", address: "Washim, Maharashtra", role: "USER" },
    { name: "Aakash Sharma", email: "user12@shopstores.com", password: "User@909", address: "Akola, Maharashtra", role: "USER" },
    { name: "Megha Patel", email: "user13@shopstores.com", password: "User@010", address: "Amravati, Maharashtra", role: "USER" },
    { name: "Nikhil Joshi", email: "user14@shopstores.com", password: "User@111", address: "Wardha, Maharashtra", role: "USER" },
    { name: "Swati More", email: "user15@shopstores.com", password: "User@212", address: "Yavatmal, Maharashtra", role: "USER" },
    { name: "Gaurav Bhatt", email: "user16@shopstores.com", password: "User@313", address: "Chandrapur, Maharashtra", role: "USER" },
    { name: "Trupti Sawant", email: "user17@shopstores.com", password: "User@414", address: "Gadchiroli, Maharashtra", role: "USER" },
    { name: "Sachin Pawar", email: "user18@shopstores.com", password: "User@515", address: "Bhandara, Maharashtra", role: "USER" },
    { name: "Usha Nair", email: "user19@shopstores.com", password: "User@616", address: "Gondia, Maharashtra", role: "USER" },
    { name: "Prasad Kadam", email: "user20@shopstores.com", password: "User@717", address: "Raigad, Maharashtra", role: "USER" },
    { name: "Jyoti Shinde", email: "user21@shopstores.com", password: "User@818", address: "Ratnagiri, Maharashtra", role: "USER" },
    { name: "Vishal Borde", email: "user22@shopstores.com", password: "User@919", address: "Sindhudurg, Maharashtra", role: "USER" },
    { name: "Anjali Wagh", email: "user23@shopstores.com", password: "User@020", address: "Dhule, Maharashtra", role: "USER" },
    { name: "Tushar Chopra", email: "user24@shopstores.com", password: "User@121", address: "Jalgaon, Maharashtra", role: "USER" }
  ];

  const allUsers = [...admins, ...storeOwners, ...regularUsers];

  // Insert users sequentially to get their IDs
  const insertedUserIds = { admins: [], storeOwners: [], users: [] };

  let userIndex = 0;
  function insertNextUser() {
    if (userIndex >= allUsers.length) {
      // All users inserted, now insert stores
      insertStores(insertedUserIds);
      return;
    }

    const user = allUsers[userIndex];
    findAuthUserByEmail(user.email, (err, existing) => {
      if (err) {
        console.log("Seed user lookup error:", err);
        userIndex++;
        insertNextUser();
        return;
      }
      if (existing) {
        console.log(`User already exists: ${user.email} (ID: ${existing.id})`);
        // Track existing user IDs
        if (userIndex < admins.length) {
          insertedUserIds.admins.push(existing.id);
        } else if (userIndex < admins.length + storeOwners.length) {
          insertedUserIds.storeOwners.push(existing.id);
        } else {
          insertedUserIds.users.push(existing.id);
        }
        userIndex++;
        insertNextUser();
        return;
      }

      bcrypt.hash(user.password, 10, (hashErr, passwordHash) => {
        if (hashErr) {
          console.log("Password hash error:", hashErr);
          userIndex++;
          insertNextUser();
          return;
        }

        const insertSql = `INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)`;
        db.query(insertSql, [user.name, user.email, passwordHash, user.address, user.role], (insertErr, result) => {
          if (insertErr) {
            console.log("Seed account insert error:", insertErr);
          } else {
            console.log(`Seed account created: ${user.email} (ID: ${result.insertId})`);
            if (userIndex < admins.length) {
              insertedUserIds.admins.push(result.insertId);
            } else if (userIndex < admins.length + storeOwners.length) {
              insertedUserIds.storeOwners.push(result.insertId);
            } else {
              insertedUserIds.users.push(result.insertId);
            }
          }
          userIndex++;
          insertNextUser();
        });
      });
    });
  }

  // Start inserting users
  insertNextUser();
}

function insertStores(insertedUserIds) {
  // Wait a moment for user insertion to complete
  setTimeout(() => {
    const storeOwnerIds = insertedUserIds.storeOwners;
    const userIds = insertedUserIds.users;

    if (storeOwnerIds.length === 0) {
      console.log("No store owners available, skipping store seeding");
      return;
    }

    // 24 stores - 2 stores for each of the 12 store owners
    const stores = [
      // Owner 1 (Sneha Deshmukh) - 2 stores
      { name: "Fresh Mart", email: "freshmart@shopstores.com", address: "FC Road, Pune", ownerIndex: 0, rating: 4 },
      { name: "Green Grocers", email: "greengrocers@shopstores.com", address: "MG Road, Pune", ownerIndex: 0, rating: 5 },
      // Owner 2 (Vikram Singh) - 2 stores
      { name: "Tech Hub", email: "techhub@shopstores.com", address: "Civil Lines, Nagpur", ownerIndex: 1, rating: 4 },
      { name: "Digital World", email: "digitalworld@shopstores.com", address: "Sitabuldi, Nagpur", ownerIndex: 1, rating: 5 },
      // Owner 3 (Anita Kulkarni) - 2 stores
      { name: "Fashion Street", email: "fashionstreet@shopstores.com", address: "Laxmi Road, Pune", ownerIndex: 2, rating: 4 },
      { name: "Style Studio", email: "stylestudio@shopstores.com", address: "Jangali Maharaj Road, Pune", ownerIndex: 2, rating: 3 },
      // Owner 4 (Rahul Joshi) - 2 stores
      { name: "Home Essentials", email: "homeessentials@shopstores.com", address: "Ghodbunder Road, Thane", ownerIndex: 3, rating: 4 },
      { name: "Living Spaces", email: "livingspaces@shopstores.com", address: "Hiranandani, Thane", ownerIndex: 3, rating: 5 },
      // Owner 5 (Pooja Shirke) - 2 stores
      { name: "Daily Needs", email: "dailyneeds@shopstores.com", address: "Pimpri, Pune", ownerIndex: 4, rating: 3 },
      { name: "Quick Mart", email: "quickmart@shopstores.com", address: "Pimpri Chinchwad, Pune", ownerIndex: 4, rating: 4 },
      // Owner 6 (Amit Borse) - 2 stores
      { name: "Gadget Zone", email: "gadgetzone@shopstores.com", address: "Hadapsar, Pune", ownerIndex: 5, rating: 4 },
      { name: "Tech World", email: "techworld@shopstores.com", address: "Hadapsar Industrial, Pune", ownerIndex: 5, rating: 5 },
      // Owner 7 (Neha Darekar) - 2 stores
      { name: "Trend Setters", email: "trendsetters@shopstores.com", address: "Wakad, Pune", ownerIndex: 6, rating: 5 },
      { name: "Fashion Hub", email: "fashionhub@shopstores.com", address: "Wakad Main Road, Pune", ownerIndex: 6, rating: 4 },
      // Owner 8 (Rohan Bhosale) - 2 stores
      { name: "Decor Dreams", email: "decordreams@shopstores.com", address: "Viman Nagar, Pune", ownerIndex: 7, rating: 3 },
      { name: "Home Decor", email: "homedecor@shopstores.com", address: "Viman Nagar Main, Pune", ownerIndex: 7, rating: 4 },
      // Owner 9 (Swati Jadhav) - 2 stores
      { name: "Book World", email: "bookworld@shopstores.com", address: "Kothrud, Pune", ownerIndex: 8, rating: 5 },
      { name: "Stationery Plus", email: "stationeryplus@shopstores.com", address: "Kothrud Depot, Pune", ownerIndex: 8, rating: 4 },
      // Owner 10 (Kiran Pawar) - 2 stores
      { name: "Sports Arena", email: "sportsarena@shopstores.com", address: "Aundh, Pune", ownerIndex: 9, rating: 4 },
      { name: "Fitness Gear", email: "fitnessgear@shopstores.com", address: "Aundh Main Road, Pune", ownerIndex: 9, rating: 5 },
      // Owner 11 (Mayuri Patil) - 2 stores
      { name: "Bakery Delight", email: "bakerydelight@shopstores.com", address: "Baner, Pune", ownerIndex: 10, rating: 5 },
      { name: "Sweet Treats", email: "sweettreats@shopstores.com", address: "Baner Road, Pune", ownerIndex: 10, rating: 4 },
      // Owner 12 (Sandeep More) - 2 stores
      { name: "Organic Store", email: "organicstore@shopstores.com", address: "Hinjewadi, Pune", ownerIndex: 11, rating: 4 },
      { name: "Health Foods", email: "healthfoods@shopstores.com", address: "Hinjewadi Phase 1, Pune", ownerIndex: 11, rating: 5 }
    ];

    let storeIndex = 0;
    function insertNextStore() {
      if (storeIndex >= stores.length) {
        console.log("All stores seeded!");
        // Now insert ratings
        insertRatings(storeOwnerIds, userIds);
        return;
      }

      const store = stores[storeIndex];
      const ownerId = storeOwnerIds[store.ownerIndex] || storeOwnerIds[0];

      // Check if store already exists
      db.query("SELECT id FROM stores WHERE email = ?", [store.email], (err, existing) => {
        if (err) {
          console.log("Store lookup error:", err);
          storeIndex++;
          insertNextStore();
          return;
        }
        if (existing.length > 0) {
          console.log(`Store already exists: ${store.name} (ID: ${existing[0].id})`);
          storeIndex++;
          insertNextStore();
          return;
        }

        const insertSql = `INSERT INTO stores (name, email, address, owner_id, rating) VALUES (?, ?, ?, ?, ?)`;
        db.query(insertSql, [store.name, store.email, store.address, ownerId, store.rating], (insertErr, result) => {
          if (insertErr) {
            console.log("Store insert error:", insertErr);
          } else {
            console.log(`Store created: ${store.name} (ID: ${result.insertId})`);
          }
          storeIndex++;
          insertNextStore();
        });
      });
    }

    insertNextStore();
  }, 500);
}

function insertRatings(storeOwnerIds, userIds) {
  setTimeout(() => {
    if (userIds.length === 0) {
      console.log("No regular users available, skipping rating seeding");
      return;
    }

    // Get all stores first
    db.query("SELECT id FROM stores ORDER BY id", (err, stores) => {
      if (err || stores.length === 0) {
        console.log("No stores available for ratings");
        return;
      }

      // Create ratings - each user rates 3-4 different stores
      const ratings = [];
      const used = new Set();

      userIds.forEach((userId, uIdx) => {
        // Each user rates 3-4 stores
        const numRatings = 3 + (uIdx % 2);
        let count = 0;
        let attempts = 0;

        while (count < numRatings && attempts < 20) {
          const storeIdx = Math.floor(Math.random() * stores.length);
          const key = `${userId}-${stores[storeIdx].id}`;

          if (!used.has(key)) {
            used.add(key);
            ratings.push({
              user_id: userId,
              store_id: stores[storeIdx].id,
              rating: Math.floor(Math.random() * 5) + 1 // 1-5
            });
            count++;
          }
          attempts++;
        }
      });

      let ratingIndex = 0;
      function insertNextRating() {
        if (ratingIndex >= ratings.length) {
          console.log("All ratings seeded!");
          console.log("=== SEEDING COMPLETE ===");
          console.log(`Admins: ${storeOwnerIds.admins || storeOwnerIds.length}`);
          console.log(`Store Owners: ${storeOwnerIds.length}`);
          console.log(`Regular Users: ${userIds.length}`);
          console.log(`Stores: ${stores.length}`);
          console.log(`Ratings: ${ratings.length}`);
          return;
        }

        const r = ratings[ratingIndex];
        // Check if rating already exists
        db.query("SELECT id FROM ratings WHERE user_id = ? AND store_id = ?", [r.user_id, r.store_id], (err, existing) => {
          if (err || (existing && existing.length > 0)) {
            ratingIndex++;
            insertNextRating();
            return;
          }

          const insertSql = `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)`;
          db.query(insertSql, [r.user_id, r.store_id, r.rating], (insertErr) => {
            if (insertErr) {
              console.log("Rating insert error:", insertErr);
            } else {
              console.log(`Rating created: User ${r.user_id} -> Store ${r.store_id} (${r.rating}/5)`);
            }
            ratingIndex++;
            insertNextRating();
          });
        });
      }

      insertNextRating();
    });
  }, 1000);
}

app.post("/signup", (req, res) => {
  const { name, email, password, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }
  if (!validateName(name)) {
    return res.status(400).json({ message: "Name must be 20-60 characters." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ message: "Password must be 8-16 chars, include uppercase and special character." });
  }
  if (address && !validateAddress(address)) {
    return res.status(400).json({ message: "Address must be at most 400 characters." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], (checkErr, users) => {
    if (checkErr) return res.status(500).json({ message: "Database error" });
    if (users.length > 0) return res.status(409).json({ message: "Email already registered" });

    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) return res.status(500).json({ message: "Password hash failed" });
      const insertSql = `
        INSERT INTO users (name, email, password, address, role)
        VALUES (?, ?, ?, ?, 'USER')
      `;
      db.query(insertSql, [name.trim(), email.trim(), hashedPassword, address?.trim() || null], (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: "Failed to create account" });
        res.json({ id: result.insertId, name: name.trim(), email: email.trim(), address: address?.trim() || null, role: "USER" });
      });
    });
  });
});

app.post(
  "/login",
  passport.authenticate("local", { failWithError: true }),
  (req, res) => {
    const { id, name, email, role, address } = req.user;
    res.json({ id, name, email, role, address });
  },
  (err, req, res, next) => {
    res.status(401).json({ message: "Incorrect email or password." });
  }
);

app.post("/logout", (req, res) => {
  req.logout((logoutError) => {
    if (logoutError) return res.status(500).json({ message: "Logout failed" });
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
});

app.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const { id, name, email, role, address } = req.user;
  res.json({ id, name, email, role, address });
});
// Admin debug (counts only) - helps verify separate admins table seeding
app.get("/admin/debug/counts", (req, res) => {
  db.query("SELECT COUNT(*) AS users_count FROM users", (err1, usersRows) => {
    if (err1) return res.status(500).json({ message: "Failed users count", error: err1.message });

    db.query("SELECT COUNT(*) AS admins_count FROM admins", (err2, adminsRows) => {
      if (err2) return res.status(500).json({ message: "Failed admins count", error: err2.message });

      res.json({
        users_count: usersRows?.[0]?.users_count ?? 0,
        admins_count: adminsRows?.[0]?.admins_count ?? 0,
      });
    });
  });
});

app.get("/admin", (req, res) => {
  const sqlUsers = "SELECT * FROM users";
  const sqlStores = "SELECT * FROM stores";
  const sqlRatings = "SELECT * FROM ratings";
  const sqlAdmins = "SELECT * FROM users WHERE role='ADMIN'";

  db.query(sqlUsers, (err1, users) => {
    if (err1) return res.status(500).json(err1);

    db.query(sqlStores, (err2, stores) => {
      if (err2) return res.status(500).json(err2);

      db.query(sqlRatings, (err3, ratings) => {
        if (err3) return res.status(500).json(err3);

        db.query(sqlAdmins, (err4, admins) => {
          if (err4) return res.status(500).json(err4);

          res.json({
            users,
            stores,
            ratings,
            admins
          });
        });
      });
    });
  });
});

app.get("/users", (req, res) => {
  db.query("SELECT id, name, email, address, role FROM users ORDER BY name", (err, users) => {
    if (err) return res.status(500).json({ message: "Failed to load users" });
    res.json(users);
  });
});

app.get("/stores", (req, res) => {
  const sql = `
    SELECT s.id, s.name, s.email, s.address, s.owner_id,
      IFNULL(ROUND(AVG(r.rating), 1), 0) AS overall_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
    ORDER BY s.name
  `;
  db.query(sql, (err, stores) => {
    if (err) return res.status(500).json({ message: "Failed to load stores" });
    res.json(stores);
  });
});

app.get("/stores/with-user", (req, res) => {
  const sql = `
    SELECT s.id, s.name, s.email, s.address, s.owner_id,
      IFNULL(ROUND(AVG(r.rating), 1), 0) AS overall_rating,
      MAX(CASE WHEN r.user_id = ? THEN r.rating ELSE NULL END) AS submitted_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
    ORDER BY s.name
  `;
  db.query(sql, [req.user.id], (err, stores) => {
    if (err) return res.status(500).json({ message: "Failed to load stores" });
    res.json(stores);
  });
});

app.get("/stores/owner", requireRole("STORE_OWNER"), (req, res) => {
  const storeSql = `
    SELECT s.id, s.name, s.email, s.address,
      IFNULL(ROUND(AVG(r.rating), 1), 0) AS average_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.owner_id = ?
    GROUP BY s.id
    ORDER BY s.name
  `;
  db.query(storeSql, [req.user.id], (err, stores) => {
    if (err) return res.status(500).json({ message: "Failed to load owner stores" });
    res.json({ stores });
  });
});

app.get("/stores/owner/ratings", requireRole("STORE_OWNER"), (req, res) => {
  const sql = `
    SELECT r.id, r.store_id, r.rating, u.id AS user_id, u.name AS user_name, u.email AS user_email, s.name AS store_name
    FROM ratings r
    JOIN stores s ON r.store_id = s.id
    JOIN users u ON r.user_id = u.id
    WHERE s.owner_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load store owner rating details" });
    res.json(rows);
  });
});

app.get("/stores/search", (req, res) => {
  const name = (req.query.name || "").toLowerCase();
  const address = (req.query.address || "").toLowerCase();
  const sql = `
    SELECT s.id, s.name, s.email, s.address, s.owner_id,
      IFNULL(ROUND(AVG(r.rating), 1), 0) AS overall_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE LOWER(s.name) LIKE ? AND LOWER(s.address) LIKE ?
    GROUP BY s.id
    ORDER BY s.name
  `;
  db.query(sql, [`%${name}%`, `%${address}%`], (err, stores) => {
    if (err) return res.status(500).json({ message: "Failed to search stores" });
    res.json(stores);
  });
});

app.get("/ratings/user", (req, res) => {
  const sql = `
    SELECT r.id, r.store_id, r.rating, s.name AS store_name, s.address AS store_address
    FROM ratings r
    JOIN stores s ON r.store_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load user ratings" });
    res.json(rows);
  });
});

app.put("/users/:id/password", requireAuth, (req, res) => {
  const targetId = Number(req.params.id);
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || !validatePassword(newPassword)) {
    return res.status(400).json({ message: "New password must be 8-16 chars, include uppercase and special character." });
  }
  if (req.user.id !== targetId && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const findSql = `
    SELECT id, password, role
    FROM users
    WHERE id = ?
    UNION ALL
    SELECT id, password, role
    FROM admins
    WHERE id = ?
    LIMIT 1
  `;

  db.query(findSql, [targetId, targetId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    const record = rows[0];
    if (!record) return res.status(404).json({ message: "User not found" });

    function updatePassword() {
      bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
        if (hashErr) return res.status(500).json({ message: "Password hashing failed" });
        const updateSql = record.role === "ADMIN"
          ? `UPDATE admins SET password = ? WHERE id = ?`
          : `UPDATE users SET password = ? WHERE id = ?`;
        db.query(updateSql, [hashedPassword, targetId], (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Failed to update password" });
          res.json({ message: "Password updated successfully" });
        });
      });
    }

    if (req.user.role !== "ADMIN") {
      if (!oldPassword) return res.status(400).json({ message: "Current password is required." });
      bcrypt.compare(oldPassword, record.password, (compareErr, matched) => {
        if (compareErr) return res.status(500).json({ message: "Error validating password" });
        if (!matched) return res.status(403).json({ message: "Current password is incorrect" });
        updatePassword();
      });
    } else {
      updatePassword();
    }
  });
});

app.post("/users", (req, res) => {
  const { name, email, password, address, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) return res.status(500).json({ message: "Password hashing failed" });
    const sql = `
      INSERT INTO users (name, email, password, address, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, email, hashedPassword, address || null, role || "USER"], (insertErr, result) => {
      if (insertErr) {
        console.log("User insert error", insertErr);
        return res.status(500).json({ message: "Failed to create user" });
      }
      res.json({ id: result.insertId, name, email, address: address || null, role: role || "USER" });
    });
  });
});

app.post("/admins", (req, res) => {
  const { name, email, password, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) return res.status(500).json({ message: "Password hashing failed" });
    const sql = `
      INSERT INTO users (name, email, password, address, role)
      VALUES (?, ?, ?, ?, 'ADMIN')
    `;
    db.query(sql, [name, email, hashedPassword, address || null], (insertErr, result) => {
      if (insertErr) {
        console.log("Admin insert error", insertErr);
        return res.status(500).json({ message: "Failed to create admin" });
      }
      res.json({ id: result.insertId, name, email, address: address || null, role: 'ADMIN' });
    });
  });
});

app.post("/ratings", requireAuth, (req, res) => {
  const { store_id, rating, review } = req.body;
  if (!store_id || rating === undefined || rating === null) {
    return res.status(400).json({ message: "Store ID and rating are required" });
  }
  const parsedRating = Number(rating);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const sql = `
    INSERT INTO ratings (user_id, store_id, rating, review)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      review = VALUES(review),
      created_at = created_at
  `;

  db.query(sql, [req.user.id, store_id, parsedRating, review || null], (err, result) => {
    if (err) {
      console.log("Rating upsert error", err);
      return res.status(500).json({ message: "Failed to submit rating" });
    }
    res.json({ user_id: req.user.id, store_id, rating: parsedRating, review: review || null });
  });
});

app.put("/ratings", requireAuth, (req, res) => {
  const { store_id, rating, review } = req.body;
  if (!store_id || rating === undefined || rating === null) {
    return res.status(400).json({ message: "Store ID and rating are required" });
  }
  const parsedRating = Number(rating);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const sql = `
    UPDATE ratings
    SET rating = ?, review = ?
    WHERE user_id = ? AND store_id = ?
  `;

  db.query(sql, [parsedRating, review || null, req.user.id, store_id], (err, result) => {
    if (err) {
      console.log("Rating update error", err);
      return res.status(500).json({ message: "Failed to update rating" });
    }
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Rating not found for this store/user" });
    }
    res.json({ message: "Rating updated", user_id: req.user.id, store_id, rating: parsedRating, review: review || null });
  });
});

app.post("/stores", (req, res) => {
  const { name, email, address, owner_id, rating } = req.body;
  if (!name) return res.status(400).json({ message: "Missing required store name" });
  const sql = `
    INSERT INTO stores (name, email, address, owner_id, rating)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [name.trim(), email?.trim() || null, address?.trim() || null, owner_id || null, rating || null], (err, result) => {
    if (err) {
      console.log("Store insert error", err);
      return res.status(500).json({ message: "Failed to create store" });
    }
    res.json({ id: result.insertId, name: name.trim(), email: email?.trim() || null, address: address?.trim() || null, owner_id: owner_id || null, rating: rating || null });
  });
});

// Clear all data and re-seed with fresh sample data (admin only)
app.post("/admin/reset-data", requireRole("ADMIN"), (req, res) => {
  console.log("Admin requested data reset - clearing all data and re-seeding...");

  // Delete all ratings first (has foreign keys)
  db.query("DELETE FROM ratings", (err) => {
    if (err) {
      console.log("Error clearing ratings:", err);
      return res.status(500).json({ message: "Error clearing ratings", error: err.message });
    }

    // Delete all stores (has foreign key to users)
    db.query("DELETE FROM stores", (err) => {
      if (err) {
        console.log("Error clearing stores:", err);
        return res.status(500).json({ message: "Error clearing stores", error: err.message });
      }

      // Delete all users
      db.query("DELETE FROM users", (err) => {
        if (err) {
          console.log("Error clearing users:", err);
          return res.status(500).json({ message: "Error clearing users", error: err.message });
        }

        console.log("All data cleared. Now seeding fresh data...");
        // Re-seed with fresh data
        insertSeedData();

        res.json({
          message: "All data cleared and fresh sample data seeded successfully!",
          details: "3 admins, 12 store owners (each with 2 stores = 24 stores), 24 users, and ratings have been created."
        });
      });
    });
  });
});

app.get("/", (req, res) => {
  res.send("ShopStores backend running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

export default db;
