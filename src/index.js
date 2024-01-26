import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import About from './pages/About';
import './styles/global.css';

const path = window.location.pathname;
const navBar = <Navbar />;
const footer = <Footer />;

const App = () => {
  return (
    <Router>
      {path != "/" ? navBar : ""}
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      {path != "/" ? footer : ""}
    </Router>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;