const express = require('express');
const router = express.Router();
const pool = require('../../db');

// READ all ingredients
// @route GET /api/ingredients
// @desc Get all ingredients
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// READ a single ingredient by ID
// @route GET /api/ingredients/:id
// @desc Get ingredient by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM ingredients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Ingredient not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// CREATE a new ingredient
// @route POST /api/ingredients
// @desc Add a new ingredient
router.post('/', async (req, res) => {
    try {
        const { name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units } = req.body;

        // --- Validation ---
        if (!name || !standard_measurement_unit || purchase_pack_price === undefined || pack_quantity_in_standard_units === undefined) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }
        if (pack_quantity_in_standard_units <= 0) {
            return res.status(400).json({ msg: 'Pack quantity must be greater than zero.' });
        }

        // --- Perform the Calculation ---
        const cost_per_standard_unit = purchase_pack_price / pack_quantity_in_standard_units;
        
        const result = await pool.query(
            `INSERT INTO ingredients (name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units, cost_per_standard_unit) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units, cost_per_standard_unit]
        );
        res.status(201).json(result.rows[0]); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// UPDATE an ingredient
// @route PUT /api/ingredients/:id
// @desc Update an ingredient
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units } = req.body;
        // --- Validation ---
        if (!name || !standard_measurement_unit || purchase_pack_price === undefined || pack_quantity_in_standard_units === undefined) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }
        if (pack_quantity_in_standard_units <= 0) {
            return res.status(400).json({ msg: 'Pack quantity must be greater than zero.' });
        }

        // --- Perform the Calculation ---
        const cost_per_standard_unit = purchase_pack_price / pack_quantity_in_standard_units;

        const result = await pool.query(
            `UPDATE ingredients SET name = $1, standard_measurement_unit = $2, purchase_pack_price = $3, pack_quantity_in_standard_units = $4, cost_per_standard_unit = $5 WHERE id = $6 RETURNING *`,
            [name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units, cost_per_standard_unit, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Ingredient not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// DELETE an ingredient
// @route DELETE /api/ingredients/:id
// @desc Remove an ingredient
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM ingredients WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Ingredient not found' });
        }
        res.json({ msg: 'Ingredient deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;