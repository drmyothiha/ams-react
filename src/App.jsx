import React, { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import BookAppointment from './components/BookAppointment';
import AppointmentList from './components/AppointmentList';
import './App.css';

function App() {
  // Set 'list' as the default active tab
  const [activeTab, setActiveTab] = useState('list');
  const [appointmentsUpdated, setAppointmentsUpdated] = useState(0);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAppointmentBooked = () => {
    setAppointmentsUpdated(prev => prev + 1);
  };

  // Functions to pass to Header
  const handleFillSample = () => {
    console.log('Fill sample data requested');
  };

  const handleClearAll = () => {
    console.log('Clear all requested');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return <AppointmentList key={appointmentsUpdated} />;
      case 'book':
        return (
          <BookAppointment 
            onAppointmentBooked={handleAppointmentBooked} 
            key={appointmentsUpdated}
          />
        );
      default:
        // Fallback to AppointmentList as default
        return <AppointmentList key={appointmentsUpdated} />;
    }
  };

  return (
    <div className="container">
      <Header 
        onFillSample={handleFillSample} 
        onClearAll={handleClearAll} 
      />
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
      {renderContent()}
    </div>
  );
}

export default App;