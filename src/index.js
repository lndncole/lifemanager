//src/
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import HomeComonent from './HomeComponent';
import PostAuth from './PostAuth';
import './styles.css';

const container = document.getElementById('root');

const App = () => {
  return (
    <Router>
        <Routes>
          <Route path="/post-auth" element={<PostAuth />} />
          <Route path="/" element={<HomeComonent />} />
        </Routes>
    </Router>
  );
};

const root = createRoot(container);
root.render(<App />);

export default App;