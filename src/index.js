//src/index.js
//Dependencies
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import ReactGA from 'react-ga4';

//Components
import AuthenticatedRoute from './components/AuthenticatedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

//Pages
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import About from './pages/About';

//Styles
import './styles/global.css';

//Init middleware
ReactGA.initialize('G-S551MB5RNK');

const App = () => {
  return (
    <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/home" element={
            <AuthenticatedRoute>
              <Home />
            </AuthenticatedRoute>
          }/>
          <Route path="/about" element={<About />} />
        </Routes>
        <Footer />
    </Router>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;