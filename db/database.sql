-- This SQL script creates the database schema for the food calculator project.
-- It includes two tables: ingredients and recipes.
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS recipes;

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    standard_measurement_unit VARCHAR(50) NOT NULL,
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

-- Sample data for ingredients
INSERT INTO ingredients (name, price, standard_measurement_unit) VALUES
('Chicken', 5.00, 'g'),
('Rice', 2.00, 'g'),
('Broccoli', 1.50, 'g'),
('Carrots', 1.00, 'g'),
('Potatoes', 0.50, 'g'),
('Pasta', 1.20, 'g'),
('Tomato Sauce', 1.80, 'ml'),
('Cheese', 2.50, 'g'),
('Olive Oil', 3.00, 'ml'),
('Salt', 0.10, 'g');

-- Sample data for recipes
INSERT INTO recipes (name, price) VALUES
('Chicken and Rice', 8.00),
('Vegetarian Pasta', 6.00);

-- Sample data for recipe_ingredients
-- Chicken and Rice (id = 1)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(1, 1, 200, 'g'),   -- Chicken
(1, 2, 100, 'g'),   -- Rice
(1, 4, 50, 'g'),    -- Carrots
(1, 10, 2, 'g');    -- Salt

-- Vegetarian Pasta (id = 2)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(2, 6, 100, 'g'),   -- Pasta
(2, 7, 100, 'ml'),  -- Tomato Sauce
(2, 3, 50, 'g'),    -- Broccoli
(2, 8, 30, 'g'),    -- Cheese
(2, 9, 10, 'ml'),   -- Olive Oil
(2, 10, 2, 'g');    -- Salt

