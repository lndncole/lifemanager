import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './Calendar'; // Import the Calendar component
import ButtonComponent from './ButtonComponent';

const App = () => {
  return (
    <Router>
      <div>
        <h1>Welcome to My App</h1>
        {/* The button is always visible regardless of the route */}
        <ButtonComponent />
        <Routes>
          {/* Update the Route component usage */}
          <Route path="/" element={<ButtonComponent />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </div>
    </Router>
  );
};

// Render the App component to the DOM
ReactDOM.render(<App />, document.getElementById('root'));

export default App;
