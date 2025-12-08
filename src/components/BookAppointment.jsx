import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from './Autocomplete';

const BookAppointment = ({ onAppointmentBooked }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    startDateTime: '',
    endDateTime: '',
    duration: '',
    status: 'scheduled',
    diagnosis: '',
    procedureCode: '',
    priority: '0',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  useEffect(() => {
    // Set default times
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      startDateTime: formatDateTime(start),
      endDateTime: formatDateTime(end),
      duration: '45'
    }));
  }, []);

  const formatDateTime = (date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProcedureSelect = (procedure) => {
    setSelectedProcedure(procedure);
    setFormData(prev => ({
      ...prev,
      diagnosis: procedure.Title,
      procedureCode: procedure.Code
    }));
  };

  const handleClearProcedure = () => {
    setSelectedProcedure(null);
    setFormData(prev => ({
      ...prev,
      diagnosis: '',
      procedureCode: ''
    }));
  };

  const calculateDuration = () => {
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);
    
    if (start && end && end > start) {
      const duration = Math.round((end - start) / (1000 * 60));
      setFormData(prev => ({ ...prev, duration: duration.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost/api/book-appointment', formData);
      
      if (response.data.success) {
        setSuccess({
          message: `Appointment ID: ${response.data.appointmentId}`,
          fhirResource: response.data.fhirResource
        });
        
        // Reset form
        setTimeout(() => {
          const now = new Date();
          const start = new Date(now.getTime() + 60 * 60 * 1000);
          const end = new Date(start.getTime() + 45 * 60 * 1000);
          
          setFormData({
            patientId: '',
            patientName: '',
            doctorId: '',
            doctorName: '',
            startDateTime: formatDateTime(start),
            endDateTime: formatDateTime(end),
            duration: '45',
            status: 'scheduled',
            diagnosis: '',
            procedureCode: '',
            priority: '0',
            notes: ''
          });
          setSelectedProcedure(null);
          
          // Notify parent to refresh appointment lists
          onAppointmentBooked();
        }, 3000);
      } else {
        setError({
          message: response.data.error || 'Booking failed',
          details: response.data.details || response.data.message
        });
      }
    } catch (err) {
      setError({
        message: 'Network error or server unreachable',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    const now = new Date();
    const sampleData = {
      patientId: 'P001',
      patientName: 'မောင်သူရိန်လင်း',
      doctorId: 'DOC001',
      doctorName: 'Dr. Aung Ko Win',
      startDateTime: formatDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      endDateTime: formatDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000)),
      duration: '45',
      status: 'scheduled',
      diagnosis: 'Appendectomy',
      procedureCode: '',
      priority: '2',
      notes: 'RLQ pain, fever, nausea. Suspected acute appendicitis.'
    };

    setFormData(sampleData);
    // Clear any selected procedure since we're filling manually
    setSelectedProcedure(null);
  };

  const clearAllFields = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    
    setFormData({
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      startDateTime: formatDateTime(start),
      endDateTime: formatDateTime(end),
      duration: '45',
      status: 'scheduled',
      diagnosis: '',
      procedureCode: '',
      priority: '0',
      notes: ''
    });
    setSelectedProcedure(null);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="tab-content active">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="section-info">
            <h3><i className="fas fa-user"></i> Patient Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="patientId">Patient ID *</label>
                <input
                  type="text"
                  id="patientId"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., P001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="patientName">Patient Name *</label>
                <input
                  type="text"
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., မောင်သူရိန်လင်း"
                />
              </div>
            </div>
          </div>

          <div className="doctor-info">
            <h3><i className="fas fa-user-md"></i> Doctor Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="doctorId">Doctor ID *</label>
                <input
                  type="text"
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., DOC001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="doctorName">Doctor Name *</label>
                <input
                  type="text"
                  id="doctorName"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Dr. Aung Ko Win"
                />
              </div>
            </div>
          </div>

          <div className="appointment-info">
            <h3><i className="fas fa-calendar-alt"></i> Appointment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDateTime">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  id="startDateTime"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleInputChange}
                  onBlur={calculateDuration}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDateTime">End Date & Time *</label>
                <input
                  type="datetime-local"
                  id="endDateTime"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleInputChange}
                  onBlur={calculateDuration}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 45"
                  min="15"
                  max="240"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="arrived">Arrived</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="medical-info">
            <h3><i className="fas fa-stethoscope"></i> Medical Information</h3>
            <div className="form-row">
              <div className="form-group">
                <Autocomplete
                  value={formData.diagnosis}
                  onChange={(value) => setFormData(prev => ({ ...prev, diagnosis: value }))}
                  onProcedureSelect={handleProcedureSelect}
                  onClear={handleClearProcedure}
                  placeholder="Start typing procedure name (e.g., Appendectomy)..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="0">Routine (0)</option>
                  <option value="1">Urgent (1)</option>
                  <option value="2">ASAP (2)</option>
                  <option value="3">STAT (3)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Clinical Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter clinical notes, symptoms, observations..."
              />
            </div>
          </div>

          <div className="form-row">
            <button type="button" className="sample-btn" onClick={fillSampleData}>
              <i className="fas fa-flask"></i> Fill Sample Data
            </button>
            <button type="button" className="sample-btn" onClick={clearAllFields}>
              <i className="fas fa-broom"></i> Clear All
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Book Appointment
                </>
              )}
            </button>
          </div>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Converting EHR to FHIR and booking appointment...</p>
          </div>
        )}

        {success && (
          <div className="result-container success">
            <h3><i className="fas fa-check-circle"></i> Appointment Booked Successfully!</h3>
            <p>{success.message}</p>
            <h4>FHIR Resource:</h4>
            <pre>{JSON.stringify(success.fhirResource, null, 2)}</pre>
          </div>
        )}

        {error && (
          <div className="result-container error">
            <h3><i className="fas fa-exclamation-circle"></i> Booking Failed</h3>
            <p>{error.message}</p>
            <pre>{JSON.stringify(error.details, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;