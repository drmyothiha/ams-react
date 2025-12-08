import React from 'react';
import './Tabs.css';

function Tabs({ activeTab, onTabChange }) {
  return (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'list' ? 'active' : ''}`}
        onClick={() => onTabChange('list')}
      >
        Appointment List
      </button>
      <button
        className={`tab ${activeTab === 'book' ? 'active' : ''}`}
        onClick={() => onTabChange('book')}
      >
        Book Appointment
      </button>
    </div>
  );
}

export default Tabs;