const multer = require("multer");
const path = require("path");

const imageFilter = (req, file, cb) => {
  var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'
        && ext !== '.doc' && ext !== '.docx' && ext !== '.xlsx' && ext !== '.xls'
        && ext !== '.pdf') {
            return cb(new Error('Only docs are allowed'))
        }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("File upload")
    try{
    cb(null, "./public/uploads");
    }
    catch (error){
      console.log(error)
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-accrepro-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage});

module.exports = uploadFile;
