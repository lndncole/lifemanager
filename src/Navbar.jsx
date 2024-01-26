import React from 'react';
import { Link } from 'react-router-dom';
import './styles/navbar.css';

export default function Navbar() {
    return (
        <nav class="nav">
            <Link to="/" class="logo">
                lifeMNGR
            </Link>
        </nav>
    );
};