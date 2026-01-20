import express from "express"
import pool from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get current stock levels
router.get("/levels", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, i.name as item_name, i.item_code, i.reorder_level,
             c.name as category_name, u.abbreviation as unit
      FROM stock s
      JOIN items i ON s.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      WHERE i.is_active = true
      ORDER BY i.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching stock levels:", error)
    res.status(500).json({ error: "Failed to fetch stock levels" })
  }
})

// Get low stock items
router.get("/low-stock", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, i.name as item_name, i.item_code, i.reorder_level,
             c.name as category_name, u.abbreviation as unit
      FROM stock s
      JOIN items i ON s.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      WHERE i.is_active = true AND s.quantity <= i.reorder_level
      ORDER BY (s.quantity - i.reorder_level), i.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching low stock items:", error)
    res.status(500).json({ error: "Failed to fetch low stock items" })
  }
})

// Get stock movements for an item
router.get("/movements/:itemId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT sm.*, i.name as item_name, u.full_name as performed_by_name
      FROM stock_movements sm
      JOIN items i ON sm.item_id = i.id
      LEFT JOIN users u ON sm.performed_by = u.id
      WHERE sm.item_id = $1
      ORDER BY sm.movement_date DESC
      LIMIT 100
    `,
      [req.params.itemId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    res.status(500).json({ error: "Failed to fetch stock movements" })
  }
})

export default router
