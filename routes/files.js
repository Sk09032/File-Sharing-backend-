const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/file");
const { v4: uuid4 } = require("uuid");
const { download } = require("express/lib/response");

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "upload/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({
  storage,
  limit: { fileSize: 1000000 * 100 },
}).single("myFiles");

router.post("/", (req, res) => {
  //Store files
  upload(req, res, async (err) => {
    //validate request
    if (!req.file) {
      return res.json({ error: "All field are required." });
    }
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    //Store into Database
    const file = new File({
      filename: req.file.filename,
      uuid: uuid4(),
      path: req.file.path,
      size: req.file.size,
    });

    const response = await file.save();
    //Respose -> link
    return res.json({
      file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
      // http://localhost:3000/files/43ktg3gtbkbvk-43r2vhvjhvrjhv
    });
  });
});

router.post("/send", async (req, res) => {
  const { uuid, emailTo, emailFrom } = req.body;
  // Validate Request
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: "All field are required" });
  }

  // Get Data from Database

  const file = await File.findOne({ uuid: uuid });

  if (file.sender) {
    res.status(422).send({ error: "Email already sent." });
  }

  file.sender = emailFrom;
  file.receiver = emailTo;
  const response = await file.save;

  //send email
  const emailSend = require("../services/emailService");
  emailSend({
    from: emailFrom,
    to: emailTo,
    subject: "File Sharing",
    text: `${emailFrom} shared a file with you`,
    html: require("../services/emailTemplate")({
      emailFrom: emailFrom,
      downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
      size: parseInt(file.size / 1000) + "KB",
      expires: "24 hours",
    }),
  });

  return res.send({ success: true });
});

module.exports = router;
