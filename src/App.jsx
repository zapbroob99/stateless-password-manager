// src/App.jsx
import React, { Suspense } from 'react';
import PasswordGenerator from './components/PasswordGenerator';
import './App.css';

function App() {
    return (
        <Suspense fallback="Loading...">
            <div className="App">
                <PasswordGenerator />
            </div>
        </Suspense>
    );
}

export default App;