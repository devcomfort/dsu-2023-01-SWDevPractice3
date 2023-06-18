import nodemailer from "nodemailer";
import pug from "pug";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const currentUrl = import.meta.url;
const currentDir = path.dirname(fileURLToPath(currentUrl));
const configPath = path.join(currentDir, "..", "..", "..", ".env");
const templatesPath = path.join(currentDir, "..", "templates");

dotenv.config({
  path: configPath,
});

const EMAIL_ADDR = process.env.EMAIL_ADDR;
const EMAIL_PASS = process.env.EMAIL_PASS;

const sendEmail = (auth_link: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_ADDR,
      pass: EMAIL_PASS,
    },
  });

  const templatePath = path.join(templatesPath, "new_auth_code.pug");
  const renderedHTML = pug.renderFile(templatePath, {
    verificationLink: auth_link,
    title: "롯데월드 유실물 알림 서비스 인증 메일",
  });

  // 이메일 옵션 설정 및 전송
  const mailOptions = {
    from: `롯데월드 유실물 알림 서비스 <${EMAIL_ADDR}>`,
    to: "kimdonghyun026@gmail.com",
    subject: "롯데월드 유실물 알림 서비스 인증 메일",
    html: renderedHTML,
  };

  // @ts-ignore
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error occurred while sending email: %s", error);
    } else {
      console.log("Message sent: %s", info.messageId);
    }
  });
};

export { sendEmail };
