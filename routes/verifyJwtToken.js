const jwt = require("jsonwebtoken");
const config = require("../config/jwtConfig.js");
// const config = require('../config/config.js');
// const db = require('../config/db.config.js');
// const Role = db.role;
// const User = db.user;

verifyToken = (req, res, next) => {
  // console.log((req.headers['authorization']))
  // let token = req.headers['x-access-token'];
  let token = req.headers["authorization"];

  // console.log(jwt.decode(TokenArray[1]))
  if (!token) {
    return res.status(403).send({
      auth: false,
      message: "No token provided.",
    });
  }
  TokenArray = token.split(" ");
  token = TokenArray[1];

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(403).send({
        auth: false,
        message: "Fail to Authentication. Error -> " + err,
      });
    }

    //  console.log(decoded);

    req.userId = decoded.id;
    req.role_id = decoded.i;
    req.organization_id = req.headers["organization"];
    // console.log(req.role_id);
    next();
  });
};

// refresh=()=>{

// }

// isAdmin = (req, res, next) => {
// 	let token = req.headers['x-access-token'];

// 	User.findById(req.userId)
// 		.then(user => {
// 			user.getRoles().then(roles => {
// 				for(let i=0; i<roles.length; i++){
// 					console.log(roles[i].name);
// 					if(roles[i].name.toUpperCase() === "ADMIN"){
// 						next();
// 						return;
// 					}
// 				}

// 				res.status(403).send("Require Admin Role!");
// 				return;
// 			})
// 		})
// }

// isPmOrAdmin = (req, res, next) => {
// 	let token = req.headers['x-access-token'];

// 	User.findById(req.userId)
// 		.then(user => {
// 			user.getRoles().then(roles => {
// 				for(let i=0; i<roles.length; i++){
// 					if(roles[i].name.toUpperCase() === "PM"){
// 						next();
// 						return;
// 					}

// 					if(roles[i].name.toUpperCase() === "ADMIN"){
// 						next();
// 						return;
// 					}
// 				}

// 				res.status(403).send("Require PM or Admin Roles!");
// 			})
// 		})
// }

const authJwt = {};
authJwt.verifyToken = verifyToken;
// authJwt.isAdmin = isAdmin;
// authJwt.isPmOrAdmin = isPmOrAdmin;

module.exports = authJwt;
