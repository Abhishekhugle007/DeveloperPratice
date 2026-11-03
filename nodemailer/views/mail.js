require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: false,
  port: 587,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

class Mail {
  constructor() {
    this.mailOptions = {
      from: {
        address: process.env.EMAIL,
        name: "ETech Global Services",
      },
    };
  }

  setTo(receiver) {
    this.mailOptions.to = normalizeRecipients(this.mailOptions.to, receiver);
  }

  setCC(cc) {
    this.mailOptions.cc = normalizeRecipients(this.mailOptions.cc, cc);
  }

  setBCC(bcc) {
    this.mailOptions.bcc = normalizeRecipients(this.mailOptions.bcc, bcc);
  }

  setSubject(subject) {
    this.mailOptions.subject = subject;
  }

  setText(text) {
    this.mailOptions.text = text;
  }

  setHtml(html) {
    this.mailOptions.html = html;
  }

  setAttachments(attachment) {
    let attachments = this.mailOptions.attachments;
    if (Array.isArray(attachments)) {
      attachments = attachments.slice();
    } else {
      attachments = [];
    }

    if (attachment) {
      attachments.push(attachment);
    }

    this.mailOptions.attachments = attachments;
  }

  async send() {
    const info = await transporter.sendMail(this.mailOptions);
    console.log("Email sent:", info.response || "Message accepted by SMTP server");
    return info;
  }
}

function normalizeRecipients(existing, value) {
  let recipients = [];
  if (Array.isArray(existing)) {
    recipients = existing.slice();
  }

  if (typeof value === "string") {
    const emailList = value.split(/[;,]/);
    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i].trim();
      if (email) {
        recipients.push(email);
      }
    }
  }

  return recipients;
}

module.exports = Mail;
