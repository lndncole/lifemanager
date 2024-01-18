import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './Calendar'; // Import the Calendar component
import ButtonComponent from './ButtonComponent';
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');

const App = () => {
  return (
    <Router>
      <div>
        <h1>Welcome to My App</h1>
        <Routes>
          {/* Update the Route component usage */}
          <Route path="/" element={<ButtonComponent />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </div>
    </Router>
  );
};

const root = createRoot(container);
root.render(<App />);

// Render the App component to the DOM
// ReactDOM.render(<App />, document.getElementById('root'));

export default App;
