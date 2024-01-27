//src/components/Navbar.jsx
import React, {useEffect, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/get-auth', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    const handleSignOut = async ()=> {
        const response = await fetch('/sign-out', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if(response.ok) {
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