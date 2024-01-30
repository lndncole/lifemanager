//src/components/Navbar.jsx
import React, {useEffect, useState} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async ()=> {
        const response = await fetch('/sign-out', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if(response.ok) {
            logout();
            window.location.href = "/";
        } else {
            console.error("Unable to log out.");
        }
    };

    return (
        <nav class="nav">
            <Link to="/home" class="logo">
                lifeMNGR
            </Link>
            <div class={isAuthenticated && "nav-item-container"}>
                <Link to="/about" class="nav-item">
                    about
                </Link>
                {isAuthenticated && (
                    <a className="nav-item" onClick={handleSignOut}>
                        sign out
                    </a>
                )}
            </div>
        </nav>
    );
};