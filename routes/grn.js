import express from "express"
import { body, validationResult } from "express-validator"
import pool from "../config/database.js"
import { authenticateToken, authorizeRoles } from "../middleware/auth.js"

const router = express.Router()

// Get all GRNs
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, s.name as supplier_name, u.full_name as received_by_name,
             COUNT(gi.id) as item_count
      FROM goods_received_notes g
      LEFT JOIN suppliers s ON g.supplier_id = s.id
      LEFT JOIN users u ON g.received_by = u.id
      LEFT JOIN grn_items gi ON g.id = gi.grn_id
      GROUP BY g.id, s.name, u.full_name
      ORDER BY g.received_date DESC, g.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching GRNs:", error)
    res.status(500).json({ error: "Failed to fetch GRNs" })
  }
})

// Get single GRN with items
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const grnResult = await pool.query(
      `
      SELECT g.*, s.name as supplier_name, u.full_name as received_by_name
      FROM goods_received_notes g
      LEFT JOIN suppliers s ON g.supplier_id = s.id
      LEFT JOIN users u ON g.received_by = u.id
      WHERE g.id = $1
    `,
      [req.params.id],
    )

    if (grnResult.rows.length === 0) {
      return res.status(404).json({ error: "GRN not found" })
    }

    const itemsResult = await pool.query(
      `
      SELECT gi.*, i.name as item_name, i.item_code, u.abbreviation as unit
      FROM grn_items gi
      JOIN items i ON gi.item_id = i.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      WHERE gi.grn_id = $1
    `,
      [req.params.id],
    )

    res.json({
      ...grnResult.rows[0],
      items: itemsResult.rows,
    })
  } catch (error) {
    console.error("Error fetching GRN:", error)
    res.status(500).json({ error: "Failed to fetch GRN" })
  }
})

// Create GRN
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "storekeeper"),
  [body("grn_number").trim().notEmpty(), body("received_date").isDate(), body("items").isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { grn_number, supplier_id, delivery_note_number, received_date, notes, items } = req.body

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Create GRN
      const grnResult = await client.query(
        `
        INSERT INTO goods_received_notes (grn_number, supplier_id, delivery_note_number, received_date, received_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [grn_number, supplier_id, delivery_note_number, received_date, req.user.id, notes],
      )

      const grn = grnResult.rows[0]

      // Add items and update stock
      for (const item of items) {
        // Insert GRN item
        await client.query(
          `
          INSERT INTO grn_items (grn_id, item_id, quantity, expiry_date, batch_number, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [grn.id, item.item_id, item.quantity, item.expiry_date, item.batch_number, item.notes],
        )

        // Update stock
        const stockResult = await client.query(
          `
          UPDATE stock SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP
          WHERE item_id = $2
          RETURNING quantity
        `,
          [item.quantity, item.item_id],
        )

        // Record movement
        await client.query(
          `
          INSERT INTO stock_movements (item_id, movement_type, quantity, balance_after, reference_type, reference_id, performed_by, reason, movement_date)
          VALUES ($1, 'IN', $2, $3, 'GRN', $4, $5, $6, $7)
        `,
          [
            item.item_id,
            item.quantity,
            stockResult.rows[0].quantity,
            grn.id,
            req.user.id,
            `GRN ${grn_number}`,
            received_date,
          ],
        )
      }

      await client.query("COMMIT")
      res.status(201).json(grn)
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error creating GRN:", error)
      res.status(500).json({ error: "Failed to create GRN" })
    } finally {
      client.release()
    }
  },
)

export default router
