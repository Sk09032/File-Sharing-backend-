const nodeMailer = require("nodemailer");

function emailSend({ from, to, subject, text, html }) {
  let transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  let info = transporter.sendMail({
    from: `FileSharing <${from}>`,
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
}

module.exports = emailSend;
