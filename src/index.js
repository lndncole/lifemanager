import React from 'react';
import ReactDOM from 'react-dom';
import ButtonComponent from './ButtonComponent.jsx'; // Import your new component

const App = () => {
  return (
    <div>
      <h1>Welcome to My App</h1>
      <ButtonComponent />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
