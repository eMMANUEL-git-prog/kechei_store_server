import express from "express"
import pool from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM units_of_measure ORDER BY name")
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching units:", error)
    res.status(500).json({ error: "Failed to fetch units" })
  }
})

export default router
