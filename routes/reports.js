import express from "express"
import pool from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Dashboard stats
router.get("/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    const [totalItems, lowStock, recentGRNs, recentIssues] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM items WHERE is_active = true"),
      pool.query(`
        SELECT COUNT(*) as count FROM stock s
        JOIN items i ON s.item_id = i.id
        WHERE i.is_active = true AND s.quantity <= i.reorder_level
      `),
      pool.query(
        "SELECT COUNT(*) as count FROM goods_received_notes WHERE received_date >= CURRENT_DATE - INTERVAL '30 days'",
      ),
      pool.query("SELECT COUNT(*) as count FROM stock_issues WHERE issue_date >= CURRENT_DATE - INTERVAL '30 days'"),
    ])

    res.json({
      totalItems: Number.parseInt(totalItems.rows[0].count),
      lowStockItems: Number.parseInt(lowStock.rows[0].count),
      recentGRNs: Number.parseInt(recentGRNs.rows[0].count),
      recentIssues: Number.parseInt(recentIssues.rows[0].count),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({ error: "Failed to fetch dashboard stats" })
  }
})

// Stock value report
router.get("/stock-by-category", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.name as category, COUNT(i.id) as item_count, COALESCE(SUM(s.quantity), 0) as total_quantity
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.is_active = true
      LEFT JOIN stock s ON i.id = s.item_id
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY c.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching stock by category:", error)
    res.status(500).json({ error: "Failed to fetch stock by category" })
  }
})

// Department consumption
router.get("/department-consumption", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.name as department, COUNT(si.id) as issue_count,
             COUNT(DISTINCT si.id) as total_issues
      FROM departments d
      LEFT JOIN stock_issues si ON d.id = si.department_id
        AND si.issue_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE d.is_active = true
      GROUP BY d.id, d.name
      ORDER BY issue_count DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching department consumption:", error)
    res.status(500).json({ error: "Failed to fetch department consumption" })
  }
})

export default router
