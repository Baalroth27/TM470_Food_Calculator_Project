const express = require('express');
const router = express.Router();
const pool = require('../../db');

// @route GET /api/ingredients
// @desc Get all ingredients
// @access Public
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route GET /api/ingredients/:id
// @desc Get ingredient by ID
// @access Public
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

// @route POST /api/ingredients
// @desc Create a new ingredient
// @access Public
// @route POST /api/ingredients
// @desc Create a new ingredient
router.post('/', async (req, res) => {
    try {
        const { name, price, standard_measurement_unit } = req.body; 

        if (!name || price === undefined || !standard_measurement_unit) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }
        
        const result = await pool.query(
            'INSERT INTO ingredients (name, price, standard_measurement_unit) VALUES ($1, $2, $3) RETURNING *',
            [name, price, standard_measurement_unit]
        );
        res.status(201).json(result.rows[0]); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route PUT /api/ingredients/:id
// @desc Update an ingredient
// @access Public
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, standard_measurement_unit } = req.body;
        if (!name || price === undefined || !standard_measurement_unit) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }
        const result = await pool.query(
            'UPDATE ingredients SET name = $1, price = $2, standard_measurement_unit = $3 WHERE id = $4 RETURNING *',
            [name, price, standard_measurement_unit, id]
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

// @route DELETE /api/ingredients/:id
// @desc Delete an ingredient
// @access Public
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