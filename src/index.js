import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './Calendar'; // Import the Calendar component
import { createRoot } from 'react-dom/client';
import HomeComonent from './HomeComponent';
const container = document.getElementById('root');

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HomeComonent />} />
        </Routes>
      </div>
    </Router>
  );
};

const root = createRoot(container);
root.render(<App />);

export default App;
