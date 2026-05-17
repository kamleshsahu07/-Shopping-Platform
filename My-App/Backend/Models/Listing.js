// DATABASE CONNECTION

    // ======================================================
    // USERS TABLE
    // =====================================================

    const createUsersTable = (db) => {

  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (

      id INT PRIMARY KEY AUTO_INCREMENT,

      name VARCHAR(60) NOT NULL,

      email VARCHAR(100) UNIQUE NOT NULL,

      password VARCHAR(255) NOT NULL,

      address VARCHAR(400),

      role ENUM('ADMIN','USER','STORE_OWNER') NOT NULL,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(usersTable, (err) => {

    if (err) {
      console.log("Users Table Error", err);
    } else {
      console.log("Users Table Ready");
    }

  });
};

export default createUsersTable;
    // ======================================================
    // STORES TABLE
    // ======================================================

   
    // ======================================================
    // RATINGS TABLE
    // ======================================================

    // ======================================================
    // DEFAULT ADMIN
    // ======================================================

//     const adminCheck = `
//       SELECT * FROM users
//       WHERE email = 'admin@gmail.com'
//     `;

//     db.query(adminCheck, (err, result) => {

//       if (err) {
//         console.log("Admin Check Error", err);
//       } else {

//         if (result.length === 0) {

//           const insertAdmin = `
//             INSERT INTO users
//             (name, email, password, address, role)

//             VALUES

//             (
//               'Main Admin User',
//               'admin@gmail.com',
//               'Admin@123',
//               'Nagpur Maharashtra',
//               'ADMIN'
//             )
//           `;

//           db.query(insertAdmin, (err) => {

//             if (err) {
//               console.log("Admin Insert Error", err);
//             } else {
//               console.log("Default Admin Added");
//             }

//           });

//         } else {
//           console.log("Admin Already Exists");
//         }

//       }

//     });

//     // ======================================================
//     // DEFAULT NORMAL USER
//     // ======================================================

//     const userCheck = `
//       SELECT * FROM users
//       WHERE email = 'user@gmail.com'
//     `;

//     db.query(userCheck, (err, result) => {

//       if (err) {
//         console.log("User Check Error", err);
//       } else {

//         if (result.length === 0) {

//           const insertUser = `
//             INSERT INTO users
//             (name, email, password, address, role)

//             VALUES

//             (
//               'Normal User Account',
//               'user@gmail.com',
//               'User@123',
//               'Nagpur Maharashtra',
//               'USER'
//             )
//           `;

//           db.query(insertUser, (err) => {

//             if (err) {
//               console.log("User Insert Error", err);
//             } else {
//               console.log("Default User Added");
//             }

//           });

//         } else {
//           console.log("User Already Exists");
//         }

//       }

//     });

//     // ======================================================
//     // DEFAULT STORE OWNER
//     // ======================================================

//     const ownerCheck = `
//       SELECT * FROM users
//       WHERE email = 'owner@gmail.com'
//     `;

//     db.query(ownerCheck, (err, result) => {

//       if (err) {
//         console.log("Owner Check Error", err);
//       } else {

//         if (result.length === 0) {

//           const insertOwner = `
//             INSERT INTO users
//             (name, email, password, address, role)

//             VALUES

//             (
//               'Store Owner Account',
//               'owner@gmail.com',
//               'Owner@123',
//               'Nagpur Maharashtra',
//               'STORE_OWNER'
//             )
//           `;

//           db.query(insertOwner, (err) => {

//             if (err) {
//               console.log("Owner Insert Error", err);
//             } else {
//               console.log("Default Store Owner Added");
//             }

//           });

//         } else {
//           console.log("Store Owner Already Exists");
//         }

//       }

//     });

//     // ======================================================
//     // ADD DEFAULT STORE
//     // ======================================================

//     const storeCheck = `
//       SELECT * FROM stores
//       WHERE email = 'mystore@gmail.com'
//     `;

//     db.query(storeCheck, (err, result) => {

//       if (err) {
//         console.log("Store Check Error", err);
//       } else {

//         if (result.length === 0) {

//           const getOwner = `
//             SELECT id FROM users
//             WHERE role = 'STORE_OWNER'
//             LIMIT 1
//           `;

//           db.query(getOwner, (err, ownerResult) => {

//             if (err) {
//               console.log("Owner Fetch Error", err);
//             } else {

//               if (ownerResult.length > 0) {

//                 const ownerId = ownerResult[0].id;

//                 const insertStore = `
//                   INSERT INTO stores
//                   (name, email, address, owner_id)

//                   VALUES

//                   (
//                     'My Grocery Store',
//                     'mystore@gmail.com',
//                     'Nagpur Maharashtra',
//                     ${ownerId}
//                   )
//                 `;

//                 db.query(insertStore, (err) => {

//                   if (err) {
//                     console.log("Store Insert Error", err);
//                   } else {
//                     console.log("Default Store Added");
//                   }

//                 });

//               }

//             }

//           });

//         } else {
//           console.log("Store Already Exists");
//         }

//       }

//     });

//     // ======================================================
//     // DASHBOARD TOTALS
//     // ======================================================

//     const dashboardQuery = `
//       SELECT
//       (SELECT COUNT(*) FROM users) AS total_users,
//       (SELECT COUNT(*) FROM stores) AS total_stores,
//       (SELECT COUNT(*) FROM ratings) AS total_ratings
//     `;

//     db.query(dashboardQuery, (err, result) => {

//       if (err) {
//         console.log("Dashboard Error", err);
//       } else {

//         console.log("Dashboard Data");
//         console.table(result);

//       }

//     });

//     // ======================================================
//     // VIEW USERS LIST
//     // ======================================================

//     const usersList = `
//       SELECT
//       id,
//       name,
//       email,
//       address,
//       role

//       FROM users
//     `;

//     db.query(usersList, (err, result) => {

//       if (err) {
//         console.log("Users List Error", err);
//       } else {

//         console.log("All Users");
//         console.table(result);

//       }

//     });

//     // ======================================================
//     // VIEW STORES WITH AVERAGE RATING
//     // ======================================================

//     const storesList = `
//       SELECT
//       stores.id,
//       stores.name,
//       stores.email,
//       stores.address,

//       ROUND(AVG(ratings.rating),1) AS average_rating

//       FROM stores

//       LEFT JOIN ratings
//       ON stores.id = ratings.store_id

//       GROUP BY stores.id
//     `;

//     db.query(storesList, (err, result) => {

//       if (err) {
//         console.log("Stores List Error", err);
//       } else {

//         console.log("All Stores");
//         console.table(result);

//       }

//     });

//     // ======================================================
//     // FILTER USERS
//     // ======================================================

//     const filterUsers = `
//       SELECT
//       id,
//       name,
//       email,
//       address,
//       role

//       FROM users

//       WHERE
//       name LIKE '%User%'
//       OR email LIKE '%gmail%'
//       OR address LIKE '%Nagpur%'
//       OR role LIKE '%ADMIN%'
//     `;

//     db.query(filterUsers, (err, result) => {

//       if (err) {
//         console.log("Filter Error", err);
//       } else {

//         console.log("Filtered Users");
//         console.table(result);

//       }

//     });

//     // ======================================================
//     // STORE OWNER RATING
//     // ======================================================

//     const ownerRatings = `
//       SELECT
//       users.name,
//       users.email,
//       users.role,

//       ROUND(AVG(ratings.rating),1) AS owner_store_rating

//       FROM users

//       LEFT JOIN stores
//       ON users.id = stores.owner_id

//       LEFT JOIN ratings
//       ON stores.id = ratings.store_id

//       WHERE users.role = 'STORE_OWNER'

//       GROUP BY users.id
//     `;

//     db.query(ownerRatings, (err, result) => {

//       if (err) {
//         console.log("Owner Rating Error", err);
//       } else {

//         console.log("Store Owner Ratings");
//         console.table(result);

//       }

//     });

//   }

// });

// module.exports = db;