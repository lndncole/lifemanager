import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
    return (
        <nav class="nav">
            <Link to="/home" class="logo">
                lifeMNGR
            </Link>
            <div class="nav-item-container">
                <Link to="/about" class="nav-item">
                    about
                </Link>
                <Link to="/" class="nav-item">
                    sign out
                </Link>
            </div>
        </nav>
    );
};