require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const cron = require("node-cron");
const axios = require("axios");
// Connect to DB
connectDB();

// Init App
const app = express();

// Middleware
app.use(helmet()); 
app.use(compression()); 
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-address"],
  })
);

// Health Check
app.get("/", (req, res) => {
  res.json({ success: true, message: "USE CRATES IS LIVE 🚀" });
});

// cron.schedule("*/15 * * * * *", async () => {
//   try {
//     console.log("🔄 Running stock price update cron job...");
//     const res = await axios.get("http://localhost:8080/api/v1/stocks/update-prices");
//     console.log("✅ Update complete:", res.data.message);
//   } catch (err) {
//     console.error("❌ Cron job error:", err.message);
//   }
// });

// Public Routes
app.use("/api/v1/waitlist", require("./routes/waitlist.routes"));
app.use("/api/v1/stocks", require("./routes/stocks.routes"));
app.use("/api/v1/crates", require("./routes/crate.routes"));
app.use("/api/v1/user", require("./routes/user.routes"));
app.use("/api/v1/transactions", require("./routes/transaction.routes"));

// Global Error Handler
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () =>
  console.log(`🌐 Server running on port ${PORT}`)
);

// Graceful Shutdown
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
