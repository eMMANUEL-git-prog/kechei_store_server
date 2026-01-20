import express from "express"
import pool from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments WHERE is_active = true ORDER BY name")
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching departments:", error)
    res.status(500).json({ error: "Failed to fetch departments" })
  }
})

export default router
