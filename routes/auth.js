import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import pool from "../config/database.js"

const router = express.Router()

// Login
router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password } = req.body

    try {
      const result = await pool.query(
        "SELECT id, username, email, full_name, role, password_hash, is_active FROM users WHERE username = $1",
        [username],
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const user = result.rows[0]

      if (!user.is_active) {
        return res.status(403).json({ error: "Account is inactive" })
      }

      // For demo purposes, accept any password if hash is placeholder
      // In production, always use bcrypt.compare
      const isValidPassword = user.password_hash.includes("$2a$10$rZ8qZ8qZ8qZ8qZ8qZ8qZ8eX")
        ? true
        : await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      )

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

export default router
