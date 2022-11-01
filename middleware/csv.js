const multer = require("multer");

const imageFilter = (req, file, cb) => {
  console.log("hello...");
  console.log(file.mimetype);

  if (
    file.mimetype.startsWith("text/csv") ||
    file.mimetype.startsWith("application/vnd.ms-excel") ||
    file.mimetype.startsWith("application/octet-stream")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only csv.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/document");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-accrepro-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });

module.exports = uploadFile;
