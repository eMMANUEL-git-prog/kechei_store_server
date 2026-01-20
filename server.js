import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import stockRoutes from "./routes/stock.js";
import grnRoutes from "./routes/grn.js";
import issueRoutes from "./routes/issues.js";
import categoryRoutes from "./routes/categories.js";
import unitRoutes from "./routes/units.js";
import departmentRoutes from "./routes/departments.js";
import supplierRoutes from "./routes/suppliers.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "https://kechei-store.vercel.app",
    ],
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/reports", reportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Store Inventory API is running" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
