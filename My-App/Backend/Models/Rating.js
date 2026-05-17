const createRatingsTable = (db) => {
  const ratingsTable = `
    CREATE TABLE IF NOT EXISTS ratings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      store_id INT NOT NULL,
      rating INT CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_store (user_id, store_id),
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      FOREIGN KEY (store_id)
        REFERENCES stores(id)
        ON DELETE CASCADE
    )
  `;

  db.query(ratingsTable, (err) => {
    if (err) {
      console.log("Ratings Table Error", err);
    } else {
      console.log("Ratings Table Ready");
    }
  });
};

export default createRatingsTable;
