import express from "express"
import { body, validationResult } from "express-validator"
import pool from "../config/database.js"
import { authenticateToken, authorizeRoles } from "../middleware/auth.js"

const router = express.Router()

// Get all stock issues
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, d.name as department_name, u.full_name as issued_by_name,
             COUNT(sii.id) as item_count
      FROM stock_issues si
      LEFT JOIN departments d ON si.department_id = d.id
      LEFT JOIN users u ON si.issued_by = u.id
      LEFT JOIN stock_issue_items sii ON si.id = sii.issue_id
      GROUP BY si.id, d.name, u.full_name
      ORDER BY si.issue_date DESC, si.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching stock issues:", error)
    res.status(500).json({ error: "Failed to fetch stock issues" })
  }
})

// Get single issue with items
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const issueResult = await pool.query(
      `
      SELECT si.*, d.name as department_name, u.full_name as issued_by_name
      FROM stock_issues si
      LEFT JOIN departments d ON si.department_id = d.id
      LEFT JOIN users u ON si.issued_by = u.id
      WHERE si.id = $1
    `,
      [req.params.id],
    )

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: "Issue not found" })
    }

    const itemsResult = await pool.query(
      `
      SELECT sii.*, i.name as item_name, i.item_code, u.abbreviation as unit
      FROM stock_issue_items sii
      JOIN items i ON sii.item_id = i.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      WHERE sii.issue_id = $1
    `,
      [req.params.id],
    )

    res.json({
      ...issueResult.rows[0],
      items: itemsResult.rows,
    })
  } catch (error) {
    console.error("Error fetching issue:", error)
    res.status(500).json({ error: "Failed to fetch issue" })
  }
})

// Create stock issue
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "storekeeper"),
  [
    body("issue_number").trim().notEmpty(),
    body("department_id").isUUID(),
    body("issue_date").isDate(),
    body("items").isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { issue_number, department_id, issued_to_person, issue_date, purpose, notes, items } = req.body

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Validate stock availability
      for (const item of items) {
        const stockCheck = await client.query("SELECT quantity FROM stock WHERE item_id = $1", [item.item_id])
        if (stockCheck.rows.length === 0 || stockCheck.rows[0].quantity < item.quantity) {
          await client.query("ROLLBACK")
          return res.status(400).json({ error: `Insufficient stock for item ${item.item_id}` })
        }
      }

      // Create issue
      const issueResult = await client.query(
        `
        INSERT INTO stock_issues (issue_number, department_id, issued_to_person, issued_by, issue_date, purpose, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, 'issued', $7)
        RETURNING *
      `,
        [issue_number, department_id, issued_to_person, req.user.id, issue_date, purpose, notes],
      )

      const issue = issueResult.rows[0]

      // Add items and update stock
      for (const item of items) {
        // Insert issue item
        await client.query(
          `
          INSERT INTO stock_issue_items (issue_id, item_id, quantity_requested, quantity_issued)
          VALUES ($1, $2, $3, $4)
        `,
          [issue.id, item.item_id, item.quantity, item.quantity],
        )

        // Update stock
        const stockResult = await client.query(
          `
          UPDATE stock SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
          WHERE item_id = $2
          RETURNING quantity
        `,
          [item.quantity, item.item_id],
        )

        // Record movement
        await client.query(
          `
          INSERT INTO stock_movements (item_id, movement_type, quantity, balance_after, reference_type, reference_id, performed_by, reason, movement_date)
          VALUES ($1, 'OUT', $2, $3, 'ISSUE', $4, $5, $6, $7)
        `,
          [
            item.item_id,
            item.quantity,
            stockResult.rows[0].quantity,
            issue.id,
            req.user.id,
            `Issue ${issue_number} to ${issued_to_person}`,
            issue_date,
          ],
        )
      }

      await client.query("COMMIT")
      res.status(201).json(issue)
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error creating issue:", error)
      res.status(500).json({ error: "Failed to create issue" })
    } finally {
      client.release()
    }
  },
)

export default router
