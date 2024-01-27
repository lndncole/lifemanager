import React from 'react';
import AuthenticatedRoute from './AuthenticatedRoute';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
    const windowLocation = window.location.href;
    const atHome = windowLocation == '/' ? true : false;

    const handleSignOut = async ()=> {
        const response = await fetch('/sign-out', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        window.location.href = "/";

    };

    return (
        <nav class="nav">
            <Link to="/home" class="logo">
                lifeMNGR
            </Link>
            <div class="nav-item-container">
                <Link to="/about" class="nav-item">
                    about
                </Link>
                <AuthenticatedRoute>
                    <a class="nav-item" onClick={handleSignOut}>
                        sign out
                    </a>
                </AuthenticatedRoute>
            </div>
        </nav>
    );
};