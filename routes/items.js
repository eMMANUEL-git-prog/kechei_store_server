import express from "express"
import { body, validationResult } from "express-validator"
import pool from "../config/database.js"
import { authenticateToken, authorizeRoles } from "../middleware/auth.js"

const router = express.Router()

// Get all items
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, active } = req.query

    let query = `
      SELECT i.*, c.name as category_name, u.name as unit_name, u.abbreviation as unit_abbr,
             s.quantity as current_stock
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      LEFT JOIN stock s ON i.id = s.item_id
      WHERE 1=1
    `
    const params = []

    if (category) {
      params.push(category)
      query += ` AND i.category_id = $${params.length}`
    }

    if (active !== undefined) {
      params.push(active === "true")
      query += ` AND i.is_active = $${params.length}`
    }

    query += " ORDER BY i.name"

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching items:", error)
    res.status(500).json({ error: "Failed to fetch items" })
  }
})

// Get single item
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT i.*, c.name as category_name, u.name as unit_name, u.abbreviation as unit_abbr,
             s.quantity as current_stock
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
      LEFT JOIN stock s ON i.id = s.item_id
      WHERE i.id = $1
    `,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching item:", error)
    res.status(500).json({ error: "Failed to fetch item" })
  }
})

// Create item
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "storekeeper"),
  [
    body("item_code").trim().notEmpty(),
    body("name").trim().notEmpty(),
    body("category_id").isUUID(),
    body("unit_of_measure_id").isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { item_code, name, description, category_id, unit_of_measure_id, reorder_level, has_expiry } = req.body

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const result = await client.query(
        `
        INSERT INTO items (item_code, name, description, category_id, unit_of_measure_id, reorder_level, has_expiry, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          item_code,
          name,
          description,
          category_id,
          unit_of_measure_id,
          reorder_level || 0,
          has_expiry || false,
          req.user.id,
        ],
      )

      // Initialize stock record
      await client.query(
        `
        INSERT INTO stock (item_id, quantity)
        VALUES ($1, 0)
      `,
        [result.rows[0].id],
      )

      await client.query("COMMIT")
      res.status(201).json(result.rows[0])
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error creating item:", error)
      res.status(500).json({ error: "Failed to create item" })
    } finally {
      client.release()
    }
  },
)

// Update item
router.put("/:id", authenticateToken, authorizeRoles("admin", "storekeeper"), async (req, res) => {
  const { name, description, category_id, unit_of_measure_id, reorder_level, has_expiry, is_active } = req.body

  try {
    const result = await pool.query(
      `
        UPDATE items 
        SET name = $1, description = $2, category_id = $3, unit_of_measure_id = $4, 
            reorder_level = $5, has_expiry = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `,
      [name, description, category_id, unit_of_measure_id, reorder_level, has_expiry, is_active, req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating item:", error)
    res.status(500).json({ error: "Failed to update item" })
  }
})

export default router
