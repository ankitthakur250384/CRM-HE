import React from 'react';

// Simple test component
function SimpleApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
          ASP Cranes CRM
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          ✅ React is working correctly!
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
          
          <button 
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.href = '/simple-login.html'}
          >
            Simple Login
          </button>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>If you can see this, React is working.</p>
          <p>The issue might be with routing or specific components.</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;
