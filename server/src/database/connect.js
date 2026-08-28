import mongoose from "mongoose";
import logger from "../logger/logger.js";
import { env } from "../config/env.js";

mongoose.set("strictQuery", true);

// Connects to MongoDB Atlas with sane production defaults.
export async function connectDB() {
    try {
        const conn = await mongoose.connect(env.MONGO_URI, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 10000,
            autoIndex: env.NODE_ENV !== "production",
        });

        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }

    mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
        logger.error(`MongoDB error: ${err.message}`);
    });
}

// Graceful shutdown
export async function disconnectDB() {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully");
}






























// import mongoose from "mongoose"
// import logger from "../logger/logger.js"
// import { env } from "../config/env.js"


// mongoose.set("strictQuery", true)

// //  * Connects to MongoDB Atlas with sane production defaults.

// export async function connectDB() {
//     try {
//         const conn = await mongoose.connect(env.MONGO_URI, {
//             maxPoolSize: 20,
//             serverSelectionTimeoutMS: 1000,
//             autoIndex: env.NODE_ENV !== "production",
//         })

//         logger.info(`MongoDB connected: ${conn.connection.host}`)
//     } catch (error) {
//         logger.error(`MongoDB connaction failed: ${error.message}`)
//         process.exit(1)
//     }

//     mongoose.connection.on("disconnected", () => {
//         logger.warn(`MongoDb error: ${err.message}`)
//     })

//     mongoose.connection.on("error", (err) => {
//         logger.error(`MongoDB error : ${err.message}`)
//     })
// }

// //  * Graceful shutdown — call this on SIGINT/SIGTERM.

// export async function disconnectDB() {
//     await mongoose.connection.close()
//     logger.info("MongoDB connection closed gracefully")
// }