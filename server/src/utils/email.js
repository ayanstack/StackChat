import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../logger/logger.js";

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = env.SMTP_USER ? env.SMTP_USER.trim() : "";
  const pass = env.SMTP_PASS ? env.SMTP_PASS.trim().replace(/\s+/g, "") : "";

  if (user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST || "smtp.gmail.com",
      port: Number(env.SMTP_PORT) || 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
    });
    return cachedTransporter;
  }

  return null;
};

// Send email
export const sendEmail = async (to, subject, html) => {
  try {
    let activeTransporter = getTransporter();

    // Fallback to Ethereal only if real SMTP credentials are missing
    if (!activeTransporter) {
      if (!testTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info(`📧 Ethereal Test SMTP initialized: ${testAccount.user}`);
      }
      activeTransporter = testTransporter;
    }

    const fromAddress = env.EMAIL_FROM || env.SMTP_USER || "noreply@stackchat.com";
    const fromName = env.EMAIL_FROM_NAME || "StackChat Security";

    const info = await activeTransporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
    });

    logger.info(`✅ Email sent successfully to ${to} (MessageID: ${info.messageId})`);
    return true;
  } catch (error) {
    logger.error(`❌ Email sending failed to ${to}: ${error.message}`);
    return false;
  }
};
