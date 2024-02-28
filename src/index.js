//src/index.js
//Dependencies
import React, { StrictMode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import ReactGA from 'react-ga4';

//Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import ChatGPT from './components/ChatGPT';

//Pages
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Calendar from './pages/Calendar';
import SignIn from './pages/SignIn';

//Styles
import './styles/global.css';

//Init middleware
ReactGA.initialize('G-S551MB5RNK');

const ChatGPTWrapper = () => {
  const { isAuthenticated } = useAuth(); // Use the useAuth hook
  const location = useLocation(); // This hook must be used within a component that has Router context

  // Only show ChatGPT if user is authenticated and not on the SignIn route
  const showChatGPT = isAuthenticated && location.pathname !== '/';

  return showChatGPT ? <ChatGPT /> : null;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
          <Navbar />
          <ChatGPTWrapper />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/home" element={
              <AuthenticatedRoute>
                <Home />
              </AuthenticatedRoute>
            }/>
            <Route path="/calendar" element={
              <AuthenticatedRoute>
                <Calendar />
              </AuthenticatedRoute>
            } />
            <Route path="/sign-in" element={<SignIn />} />
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