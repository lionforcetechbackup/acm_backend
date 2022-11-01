const mysql = require("mysql2");

// host: "accrepro.cbokga4lkail.ap-south-1.rds.amazonaws.com",
// user: "admin",
// password: "Accrepro#123",
// database: "node_accrepro",
// multipleStatements: true,

function createConnection() {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Accrepro@123",
    database: "node_accrepro",
    multipleStatements: true, 
  });
  return con;
}
const State = { 
  db: null,
};
const getcon = (cb) => {
  if (State.db && State.db !== null) {
    cb();
  } else {
    createConnection().connect((err) => {
      if (err) { 
        cb(err);
        State.db = null;
      } else {
        State.db = createConnection();
        cb();
      }
    });
  }
};

const getDb = () => {
  return State.db;
};

module.exports = { getcon, getDb };
