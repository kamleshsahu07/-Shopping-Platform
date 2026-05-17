const createAdminsTable = (db) => {
  const adminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(400),
      role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(adminsTable, (err) => {
    if (err) {
      console.log("Admins Table Error", err);
    } else {
      console.log("Admins Table Ready");
    }
  });
};

export default createAdminsTable;
