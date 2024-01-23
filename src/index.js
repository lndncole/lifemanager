//src/
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import HomeComonent from './HomeComponent';
import PostAuth from './PostAuth';

const container = document.getElementById('root');

const App = () => {
  return (
    <Router>
      <div className='app-container'>
        <Routes>
          <Route path="/post-auth" element={<PostAuth />} />
          <Route path="/" element={<HomeComonent />} />
        </Routes>
      </div>
    </Router>
  );
};

const root = createRoot(container);
root.render(<App />);

export default App;