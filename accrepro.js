const express = require("express");
const app = express();
const db = require("./models");
var cors = require("cors");
var http = require("http");

app.use(cors());

var multer = require("multer");
const morgan = require("morgan");
const PORT = process.env.PORT || 8080;
const dbNormal = require("./database/server");
const ejs = require("ejs");
// const bodyParser = require('body-parser');
app.set("view engine", "ejs");

// cors = require('./routes/cors');
// app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
 
// app.use(bodyParser.json());
const dbroot = require("./routes/tool"); //automation
app.use("/db", dbroot);

require("./routes/apiRoutes.js")(app);
require("./routes/clientRoutes.js")(app);
require("./routes/updatorRoutes.js")(app);

require("./routes/surveyorRoutes.js")(app);
require("./routes/viewerRoutes")(app);

app.use("/public", express.static("public"));

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: { message: error.message },
  });
});

dbNormal.getcon((err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    var server = http.createServer(app);
    server.setTimeout(30 * 60 * 1000);
    server.listen(PORT, () => {
      console.log(`Accrepro running in ${PORT}`);
    });
  }
});

// db.sequelize.sync({force:false}).then(()=>{

//     app.listen(PORT,()=>{
//         console.log(PORT);
//     })
// }).catch(err => {
//     console.error('Unable to connect to the database:', err);
// });

// db.sequelize.authenticate().then(() => {
//     console.log('Connection has been established successfully.Port http://localhost:'+PORT);
// })
// .catch(err => {
//     console.error('Unable to connect to the database:', err);
// });
