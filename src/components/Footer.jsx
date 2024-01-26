import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

export default function Footer() {
    return (
        <nav class="footer">
            <div class="footer-item-container">
                <Link to="/privacy-policy" class="footer-item">
                    privacy policy
                </Link>
                <Link to="/terms-of-service" class="footer-item">
                    terms of service
                </Link>
            </div>
        </nav>
    );
};