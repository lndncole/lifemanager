import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import About from './pages/About';
import './styles/global.css';

const App = () => {
  return (
    <Router>
        <AuthenticatedRoute>
          <Navbar />
        </AuthenticatedRoute> 
        <Routes>
          <Route path="/" element={<SignIn />} />
            <Route path="/home" element={
              <AuthenticatedRoute>
                <Home />
              </AuthenticatedRoute>
            }/>
          <Route path="/about" element={<About />} />
        </Routes>
        <AuthenticatedRoute>
          <Footer />
        </AuthenticatedRoute>
    </Router>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;