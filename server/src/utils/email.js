import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../logger/logger.js";

let transporter;

// Initialize Ethereal (Test) Account or Real SMTP
const initTransporter = async () => {
  try {
    if (env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || "smtp.gmail.com",
        port: Number(env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS ? env.SMTP_PASS.replace(/\s+/g, "") : "",
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false },
      });
      
      await transporter.verify();
      logger.info(`? SMTP connected successfully: ${env.SMTP_USER}`);
      return;
    }
  } catch (error) {
    logger.error(`? Real SMTP connection failed: ${error.message}. Switching to Ethereal Test Email...`);
  }

  // Fallback to Ethereal
  let testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  logger.info(`? Ethereal Test SMTP connected: ${testAccount.user}`);
};

initTransporter();

// Send email
export const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      await initTransporter();
    }

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME || "StackChat"}" <${env.EMAIL_FROM || "test@stackchat.com"}>`,
      to,
      subject,
      html,
    });

    logger.info(`? Email sent successfully to ${to}`);
    logger.info(`Message ID: ${info.messageId}`);
    
    // Log the preview URL for Ethereal emails
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      logger.info(`?? Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    logger.error(`? Email sending failed: ${error.message}`);
    return false;
  }
};
