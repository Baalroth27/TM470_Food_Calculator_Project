-- This SQL script creates the database schema for the food calculator project.
-- It includes two tables: ingredients and recipes.
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS recipes;

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ingredients (name, price) VALUES
('Chicken', 5.00),
('Rice', 2.00),
('Broccoli', 1.50),
('Carrots', 1.00),
('Potatoes', 0.50),
('Pasta', 1.20),
('Tomato Sauce', 1.80),
('Cheese', 2.50),
('Olive Oil', 3.00),
('Salt', 0.10);