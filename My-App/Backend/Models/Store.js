const createStoresTable = (db) => {

  const storesTable = `
  
    CREATE TABLE IF NOT EXISTS stores (

      id INT PRIMARY KEY AUTO_INCREMENT,

      name VARCHAR(100) NOT NULL,

      email VARCHAR(100) UNIQUE,

      address VARCHAR(400),

      owner_id INT,

      rating INT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (owner_id)
      REFERENCES users(id)
      ON DELETE SET NULL
    )
  `;

  db.query(storesTable, (err) => {

    if (err) {
      console.log("Stores Table Error", err);
    } else {
      console.log("Stores Table Ready");
    }

  });
};

export default createStoresTable;