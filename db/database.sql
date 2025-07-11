-- This SQL script creates the database schema for the food calculator project.
-- It includes two tables: ingredients and recipes.
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS recipes;

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    standard_measurement_unit VARCHAR(50) NOT NULL,
    purchase_pack_price DECIMAL(10, 2) NOT NULL,
    pack_quantity_in_standard_units DECIMAL(10, 2) NOT NULL,
    cost_per_standard_unit DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- Sample data for recipes
INSERT INTO recipes (name, price) VALUES
('Chicken and Rice', 15.00),
('Vegetarian Pasta', 12.00);

-- Sample data for ingredients with new costing structure
INSERT INTO ingredients 
(name, standard_measurement_unit, purchase_pack_price, pack_quantity_in_standard_units, cost_per_standard_unit) 
VALUES
('Chicken', 'g', 15.00, 2000, (15.00 / 2000)),
('Rice', 'g', 8.00, 5000, (8.00 / 5000)),
('Broccoli', 'g', 2.00, 500, (2.00 / 500)),
('Carrots', 'g', 1.50, 1000, (1.50 / 1000)),
('Potatoes', 'g', 3.00, 2500, (3.00 / 2500)),
('Pasta', 'g', 1.20, 500, (1.20 / 500)),
('Tomato Sauce', 'ml', 2.25, 750, (2.25 / 750)),
('Cheese', 'g', 4.00, 250, (4.00 / 250)),
('Olive Oil', 'ml', 6.00, 500, (6.00 / 500)),
('Salt', 'g', 1.00, 1000, (1.00 / 1000));

-- Sample data for recipe_ingredients
-- Note: The recipe IDs will be 1 and 2 respectively
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(1, 1, 200, 'g'),  -- Chicken in Chicken and Rice
(1, 2, 100, 'g'),  -- Rice in Chicken and Rice
(1, 4, 50, 'g'),   -- Carrots in Chicken and Rice
(1, 10, 2, 'g'),   -- Salt in Chicken and Rice
(2, 6, 100, 'g'),  -- Pasta in Vegetarian Pasta
(2, 7, 100, 'ml'), -- Tomato Sauce in Vegetarian Pasta
(2, 3, 50, 'g'),   -- Broccoli in Vegetarian Pasta
(2, 8, 30, 'g'),   -- Cheese in Vegetarian Pasta
(2, 9, 10, 'ml'),  -- Olive Oil in Vegetarian Pasta
(2, 10, 2, 'g');   -- Salt in Vegetarian Pasta

