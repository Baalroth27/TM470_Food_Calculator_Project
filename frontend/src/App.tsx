import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [ingredients, setIngredients] = useState([]);

  // Fetch message from backend
  useEffect(() => {
    fetch('http://localhost:3001/api') 
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error("Failed to fetch message:", err));

    // Fetch foods from backend
    fetch('http://localhost:3001/api/ingredients') 
      .then(res => res.json())
      .then(data => setIngredients(data))
      .catch(err => console.error("Failed to fetch ingredients:", err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Food Calculator SPA</h1>
        <p>Message from backend: {message}</p>
        <h2>Ingredients:</h2>
        {ingredients.length > 0 ? (
          <ul>
            {ingredients.map(food => (
              <li key={food.id}>{food.name} - {food.cost} calories</li>
            ))}
          </ul>
        ) : (
          <p>Loading ingredients or no ingredients found...</p>
        )}
      </header>
    </div>
  );
}

export default App;