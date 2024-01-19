import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import HomeComonent from './HomeComponent';

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

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;