import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack }) => {
        return `[${ts}] ${level}: ${stack || message}`;
    })
);

const fileFormat = combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
);

const logger = winston.createLogger({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),

        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
            format: fileFormat,
        }),

        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
            format: fileFormat,
        }),
    ],
    exitOnError: false,
});

// Separate stream so Morgan (HTTP request logging) can pipe into Winston
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;