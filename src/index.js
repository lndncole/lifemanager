//src/index.js
//Dependencies
import React, { StrictMode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import ReactGA from 'react-ga4';

//Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthenticatedRoute from './components/AuthenticatedRoute';

//Pages
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

//Styles
import './styles/global.css';

//Init middleware
ReactGA.initialize('G-S551MB5RNK');

const App = () => {
  return (
    <AuthProvider>
      <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/home" element={
              // <AuthenticatedRoute>
                <Home />
              // </AuthenticatedRoute>
            }/>
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
          <Footer />
      </Router>
    </AuthProvider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;