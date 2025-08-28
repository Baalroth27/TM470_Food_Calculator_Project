const express = require('express');
const router = express.Router();
const pool = require('../../db');

// CREATE a new recipe
// @route POST /api/recipes
// @desc Create a new recipe
router.post('/', async (req, res) => {
    try{
        const { name, price } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'A recipe name is required' });
        }

        const newRecipe = await pool.query(
            `INSERT INTO recipes (name, price) 
             VALUES ($1, COALESCE($2, 0.00)) 
             RETURNING *`,
            [name, price]
        );

        res.status(201).json(newRecipe.rows[0]);

    } catch (err) {
        console.error(err.message);
        // Handle unique constraint violation for the recipe name
        if (err.code === '23505') { 
            return res.status(400).json({ msg: 'A recipe with this name already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// READ all recipes and calculate cost
// @route GET /api/recipes
// @desc Get all recipes and their total cost
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.name, r.price, 
                   COALESCE(SUM(i.cost_per_standard_unit * ri.quantity), 0) AS calculated_cost
            FROM recipes r
            LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
            LEFT JOIN ingredients i ON ri.ingredient_id = i.id
            GROUP BY r.id, r.name, r.price
            ORDER BY r.name;
        `;
        const recipes = await pool.query(query);
        res.json(recipes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// READ a single recipe by ID
// @route GET /api/recipes/:id
// @desc Get a recipe by ID and its list of ingredients
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const recipeResult = await pool.query('SELECT id, name, price AS selling_price, created_at FROM recipes WHERE id = $1', [id]);

        if (recipeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        const recipe = recipeResult.rows[0];

        const ingredientsResult = await pool.query(
            `SELECT i.id AS ingredient_id, i.name, ri.quantity, ri.unit
             FROM recipe_ingredients ri
             JOIN ingredients i ON ri.ingredient_id = i.id
             WHERE ri.recipe_id = $1`,
            [id]
        );

        const ingredients = ingredientsResult.rows;

        res.json({
            ...recipe,
            ingredients: ingredients
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE a recipe
// @route PUT /api/recipes/:id
// @desc Update a recipe's name and price
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Please include a recipe name and price' });
        }

        const updatedRecipe = await pool.query(
            `UPDATE recipes
             SET name = $1, price = COALESCE($2, 0.00)
             WHERE id = $3
             RETURNING *`,
            [name, price, id]
        );

        if (updatedRecipe.rows.length === 0) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        res.json(updatedRecipe.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a recipe
// @route DELETE /api/recipes/:id
// @desc Delete a recipe by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRecipe = await pool.query(
            `DELETE FROM recipes WHERE id = $1 RETURNING *`,
            [id]
        );

        if (deletedRecipe.rows.length === 0) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        res.json({ msg: 'Recipe deleted successfully', deletedRecipe: deletedRecipe.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ADD an ingredient to a recipe
// @route POST /api/recipes/:recipeId/ingredients
// @desc Add an ingredient to an existing recipe
router.post('/:recipeId/ingredients', async (req, res) => {
    try {
        const { recipeId } = req.params;
        const { ingredient_id, quantity, unit } = req.body;

        // --- Validation ---
        if (!ingredient_id || quantity === undefined || !unit) {
            return res.status(400).json({ msg: 'Please provide an ingredient_id, quantity, and unit' });
        }

        const newIngredient = await pool.query(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [recipeId, ingredient_id, quantity, unit]
        );

        res.status(201).json(newIngredient.rows[0]);
    } catch (err) {
        console.error(err.message);
         // Handle case where ingredient is already in the recipe (unique constraint violation)
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'This ingredient is already in this recipe. Please update the quantity instead.' });
        }
        // Handle case where ingredient_id or recipe_id does not exist (foreign key constraint violation)
        if (err.code === '23503') {
            return res.status(404).json({ msg: 'The specified recipe or ingredient does not exist.' });
        }
        res.status(500).send('Server Error');
    }
});

// UPDATE an ingredient's quantity in a recipe
// @route PUT /api/recipes/:recipeId/ingredients/:ingredientId
// @desc Update the quantity of an ingredient in a recipe
router.put('/:recipeId/ingredients/:ingredientId', async (req, res) => {
    try {
        const { recipeId, ingredientId } = req.params;
        const { quantity, unit } = req.body;

        // --- Validation ---
        if (quantity === undefined) {
            return res.status(400).json({ msg: 'Please provide a quantity' });
        }

        const updatedIngredient = await pool.query(
            `UPDATE recipe_ingredients
             SET quantity = $1
             WHERE recipe_id = $2 AND ingredient_id = $3
             RETURNING *`,
            [quantity, recipeId, ingredientId]
        );

        if (updatedIngredient.rows.length === 0) {
            return res.status(404).json({ msg: 'Ingredient not found in this recipe' });
        }

        res.json(updatedIngredient.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE an ingredient from a recipe
// @route DELETE /api/recipes/:recipeId/ingredients/:ingredientId
// @desc Remove an ingredient from a recipe
router.delete('/:recipeId/ingredients/:ingredientId', async (req, res) => {
    try {
        const { recipeId, ingredientId } = req.params;

        const deletedIngredient = await pool.query(
            `DELETE FROM recipe_ingredients
             WHERE recipe_id = $1 AND ingredient_id = $2
             RETURNING *`,
            [recipeId, ingredientId]
        );

        if (deletedIngredient.rows.length === 0) {
            return res.status(404).json({ msg: 'Ingredient not found in this recipe' });
        }

        res.json({ msg: 'Ingredient removed successfully', deletedIngredient: deletedIngredient.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE multiple recipes
// @route DELETE /api/recipes
// @desc Remove multiple recipes by IDs
router.delete("/", async (req, res) => {
  const { ids } = req.body;
  // --- Validation ---
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ msg: "Please provide an array of IDs to delete." });
  }
  const sanitizedIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  if (sanitizedIds.length !== ids.length) {
    return res.status(400).json({ msg: "All IDs must be valid integers." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM recipes WHERE id = ANY($1::int[])`,
      [sanitizedIds]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ msg: "None of the provided recipe IDs were found." });
    }
    res.json({
      msg: `${result.rowCount} Recipe(s) deleted successfully.`,
      deleted: result.rowCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;