import React from 'react';

const SignInButton = () => {
    const handleClick = () => {
      const domain = window.location.origin;
        // Redirect to the authenticate route
        window.location.href = `${domain}/authenticate`;
    };

  return (
    <div>
      <button onClick={handleClick}>Sign In</button>
    </div>
  );
};

export default SignInButton;