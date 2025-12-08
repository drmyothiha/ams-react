import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PendingAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    loadPendingAppointments();
  }, [pagination.currentPage, pagination.itemsPerPage]); // Reload when page or itemsPerPage changes

  const loadPendingAppointments = async (page = pagination.currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/appointments/pending', {
        params: { 
          page: page,
          limit: pagination.itemsPerPage 
        }
      });
      
      // FIX: Use response.data.data instead of response.data.appointments
      setAppointments(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        currentPage: response.data.pagination.currentPage || page,
        totalPages: response.data.pagination.totalPages || 1,
        totalItems: response.data.pagination.totalItems || 0,
        hasNextPage: response.data.pagination.hasNextPage || false,
        hasPreviousPage: response.data.pagination.hasPreviousPage || false
      }));
    } catch (err) {
      setError('Failed to load pending appointments');
      console.error('Error loading pending appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    // Priority is stored as a string in the raw.priority field
    let priorityValue;
    if (typeof priority === 'object' && priority.raw && priority.raw.priority !== undefined) {
      priorityValue = priority.raw.priority.toString();
    } else if (priority !== undefined && priority !== null) {
      priorityValue = priority.toString();
    } else {
      priorityValue = '0'; // Default to Routine
    }
    
    const priorityMap = {
      '0': { class: 'priority-routine', text: 'Routine' },
      '1': { class: 'priority-urgent', text: 'Urgent' },
      '2': { class: 'priority-asap', text: 'ASAP' },
      '3': { class: 'priority-stat', text: 'STAT' },
      '4': { class: 'priority-asap', text: 'ASAP' }, // 4 is also ASAP based on your data
      '5': { class: 'priority-routine', text: 'Routine' } // 5 is also Routine based on your data
    };
    
    const badge = priorityMap[priorityValue] || { class: 'priority-routine', text: 'Routine' };
    return <span className={`priority-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getParticipantName = (participants, role) => {
    if (!participants) return null;
    const participant = participants.find(p => 
      p.actor && p.actor.reference && p.actor.reference.includes(role)
    );
    return participant ? participant.actor.display : null;
  };

  // Pagination handlers
  const handleFirstPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPreviousPage) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handleLastPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: pagination.totalPages }));
    }
  };

  const handlePageClick = (page) => {
    if (page !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page when changing items per page
    }));
  };

  const handleProcessAppointment = (id) => {
    alert(`Process appointment ${id}`);
    // Implement processing logic
  };

  const handleCancelAppointment = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      alert(`Cancel appointment ${id}`);
      // Implement cancellation logic
    }
  };

  // Calculate pagination range for page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  // Calculate showing range
  const startItem = Math.max(0, (pagination.currentPage - 1) * pagination.itemsPerPage) + 1;
  const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  return (
    <div className="tab-content active">
      <div className="appointments-header">
        <h2><i className="fas fa-clock"></i> Pending Appointments</h2>
        <div className="header-actions">
          <button className="refresh-btn" onClick={() => loadPendingAppointments()}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Pagination Controls - Top */}
      <div className="pagination-controls">
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {pagination.totalItems} pending appointments
        </div>
        
        <div className="pagination-items-per-page">
          <label htmlFor="itemsPerPage">Items per page:</label>
          <select 
            id="itemsPerPage" 
            value={pagination.itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div className="appointments-table-container">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Procedure</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="no-appointments">
                  <div className="loading-spinner"></div>
                  Loading pending appointments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="no-appointments">
                  <i className="fas fa-exclamation-triangle" style={{fontSize: '48px', color: '#ef4444', marginBottom: '10px'}}></i>
                  <br />
                  {error}
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-appointments">
                  <i className="fas fa-clock" style={{fontSize: '48px', color: '#9ca3af', marginBottom: '10px'}}></i>
                  <br />
                  No pending appointments.
                </td>
              </tr>
            ) : (
              appointments.map(appointment => {
                const startDate = new Date(appointment.start);
                const endDate = new Date(appointment.end);
                // Use patientName and doctorName directly from the data
                const patientName = appointment.patientName || 'N/A';
                const doctorName = appointment.doctorName || 'N/A';
                
                return (
                  <tr key={appointment.id}>
                    <td>
                      <strong>{startDate.toLocaleDateString()}</strong><br />
                      <small>
                        {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </small>
                    </td>
                    <td>{patientName}</td>
                    <td>{doctorName}</td>
                    <td>{appointment.diagnosis || 'N/A'}</td>
                    <td>{getPriorityBadge(appointment)}</td>
                    <td>
                      <div className="action-btns">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleProcessAppointment(appointment.id)}
                        >
                          <i className="fas fa-check"></i> Process
                        </button>
                        <button 
                          className="action-btn cancel-btn"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom */}
      {appointments.length > 0 && (
        <div className="pagination-controls bottom">
          <div className="pagination-buttons">
            <button 
              className="pagination-btn"
              onClick={handleFirstPage}
              disabled={pagination.currentPage === 1}
            >
              <i className="fas fa-angle-double-left"></i> First
            </button>
            
            <button 
              className="pagination-btn"
              onClick={handlePrevPage}
              disabled={!pagination.hasPreviousPage}
            >
              <i className="fas fa-angle-left"></i> Previous
            </button>
            
            {pageNumbers.map(page => (
              <button
                key={page}
                className={`pagination-btn ${page === pagination.currentPage ? 'active' : ''}`}
                onClick={() => handlePageClick(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage}
            >
              Next <i className="fas fa-angle-right"></i>
            </button>
            
            <button 
              className="pagination-btn"
              onClick={handleLastPage}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Last <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
          
          <div className="pagination-page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAppointments;