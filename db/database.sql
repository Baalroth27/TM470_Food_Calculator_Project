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
    final_yield_weight_grams NUMERIC(10, 2) NOT NULL DEFAULT 0,
    serving_portions INTEGER NOT NULL DEFAULT 0,
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
('Vegetarian Pasta', 12.00),
('Spaghetti Bolognese', 14.50), 
('Mushroom Risotto', 13.00), 
('Grilled Salmon with Asparagus', 18.00),
('Caesar Salad', 11.00), 
('Beef Tacos', 12.50), 
('Lentil Soup', 9.00),
('Margherita Pizza', 12.00), 
('Shepherd''s Pie', 14.00), 
('Chicken Curry', 13.50),
('Fish and Chips', 15.00), 
('Beef Burger', 14.00), 
('Pulled Pork Sandwich', 13.00),
('Club Sandwich', 12.00), 
('French Onion Soup', 8.50), 
('Caprese Salad', 10.00),
('Pad Thai', 14.00), 
('Vegetable Stir-fry', 11.50), 
('Beef Wellington', 25.00),
('Lasagna', 14.00), 
('Chicken Alfredo', 15.00), 
('Pork Schnitzel', 16.00);

-- Sample data for ingredients
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
('Salt', 'g', 1.00, 1000, (1.00 / 1000)),
-- Additional ingredients to test pagination
('Onion', 'g', 2.00, 1000, (2.00 / 1000)),
('Garlic', 'g', 1.50, 200, (1.50 / 200)),
('Bell Pepper', 'g', 3.50, 500, (3.50 / 500)),
('Zucchini', 'g', 2.50, 1000, (2.50 / 1000)),
('Spinach', 'g', 3.00, 500, (3.00 / 500)),
('Beef Mince', 'g', 12.00, 1000, (12.00 / 1000)),
('Pork Loin', 'g', 10.00, 1000, (10.00 / 1000)),
('Salmon Fillet', 'g', 25.00, 1000, (25.00 / 1000)),
('Shrimp', 'g', 18.00, 500, (18.00 / 500)),
('Flour', 'g', 1.50, 1000, (1.50 / 1000)),
('Sugar', 'g', 1.80, 1000, (1.80 / 1000)),
('Butter', 'g', 3.00, 250, (3.00 / 250)),
('Eggs', 'pc', 3.20, 12, (3.20 / 12)),
('Milk', 'ml', 1.10, 1000, (1.10 / 1000)),
('Cream', 'ml', 2.50, 500, (2.50 / 500)),
('Baguette', 'pc', 1.00, 1, (1.00 / 1)),
('White Wine Vinegar', 'ml', 2.80, 500, (2.80 / 500)),
('Black Pepper', 'g', 2.00, 100, (2.00 / 100)),
('Paprika', 'g', 1.50, 100, (1.50 / 100)),
('Dried Oregano', 'g', 1.20, 50, (1.20 / 50)),
('Canned Tomatoes', 'g', 0.90, 400, (0.90 / 400)),
('Lemon', 'pc', 1.50, 3, (1.50 / 3));

-- Sample data for recipe_ingredients
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

