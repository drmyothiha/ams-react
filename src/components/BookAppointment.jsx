import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from './Autocomplete';

const BookAppointment = ({ onAppointmentBooked }) => {
  const [formData, setFormData] = useState({
    // Appointment Details
    status: 'booked',
    priority: '0',
    
    // Service Type (Procedure)
    serviceTypeCode: '',
    serviceTypeDisplay: '',
    serviceTypeText: '',
    
    // Reason (Diagnosis)
    reasonText: '',
    reasonCode: '',
    reasonDisplay: '',
    
    // Timing
    start: '',
    end: '',
    minutesDuration: '45',
    
    // Comment
    comment: '',
    
    // Participants
    patientId: '',
    patientName: '',
    practitionerId: '',
    practitionerName: '',
    locationId: '',
    locationName: '',
    
    // Metadata
    created: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);

  useEffect(() => {
    // Set default times
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    
    // Set created time to current time in ISO format
    const created = now.toISOString();
    
    setFormData(prev => ({
      ...prev,
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
      minutesDuration: '45',
      created: created
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
      serviceTypeCode: procedure.Code,
      serviceTypeDisplay: procedure.Title,
      serviceTypeText: procedure.Title
    }));
  };

  const handleDiagnosisSelect = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setFormData(prev => ({
      ...prev,
      reasonText: diagnosis.Title,
      reasonCode: diagnosis.Code,
      reasonDisplay: diagnosis.Title
    }));
  };

  const handleClearProcedure = () => {
    setSelectedProcedure(null);
    setFormData(prev => ({
      ...prev,
      serviceTypeCode: '',
      serviceTypeDisplay: '',
      serviceTypeText: ''
    }));
  };

  const handleClearDiagnosis = () => {
    setSelectedDiagnosis(null);
    setFormData(prev => ({
      ...prev,
      reasonText: '',
      reasonCode: '',
      reasonDisplay: ''
    }));
  };

  const calculateDuration = () => {
    const start = new Date(formData.start);
    const end = new Date(formData.end);
    
    if (start && end && end > start) {
      const duration = Math.round((end - start) / (1000 * 60));
      setFormData(prev => ({ ...prev, minutesDuration: duration.toString() }));
    }
  };

  const buildFHIRPayload = () => {
    const fhirAppointment = {
      resourceType: "Appointment",
      status: formData.status,
      priority: parseInt(formData.priority, 10),
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      minutesDuration: parseInt(formData.minutesDuration, 10),
      created: new Date(formData.created).toISOString(),
      comment: formData.comment,
      participant: []
    };

    // Add serviceType if provided
    if (formData.serviceTypeCode || formData.serviceTypeText) {
      fhirAppointment.serviceType = [{
        text: formData.serviceTypeText
      }];

      if (formData.serviceTypeCode) {
        fhirAppointment.serviceType[0].coding = [{
          system: 'https://icd.who.int/devct11/ichi',
          code: formData.serviceTypeCode,
          display: formData.serviceTypeDisplay || formData.serviceTypeText
        }];
      }
    }

    // Add reasonCode if provided (Diagnosis)
    if (formData.reasonText || formData.reasonCode) {
      fhirAppointment.reasonCode = [{
        text: formData.reasonText
      }];

      if (formData.reasonCode) {
        fhirAppointment.reasonCode[0].coding = [{
          system: 'https://icd.who.int',
          code: formData.reasonCode,
          display: formData.reasonDisplay || formData.reasonText
        }];
      }
    }

    // Add participants
    if (formData.patientId) {
      fhirAppointment.participant.push({
        actor: {
          reference: `Patient/${formData.patientId}`,
          display: formData.patientName || ''
        },
        status: 'accepted',
        required: 'required'
      });
    }

    if (formData.practitionerId) {
      fhirAppointment.participant.push({
        actor: {
          reference: `Practitioner/${formData.practitionerId}`,
          display: formData.practitionerName || ''
        },
        status: 'accepted',
        required: 'required'
      });
    }

    if (formData.locationId) {
      fhirAppointment.participant.push({
        actor: {
          reference: `Location/${formData.locationId}`,
          display: formData.locationName || ''
        },
        status: 'accepted',
        required: 'required'
      });
    }

    return fhirAppointment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Build FHIR-compliant payload
      const fhirPayload = buildFHIRPayload();
      
      const response = await axios.post('http://localhost/api/book-appointment', fhirPayload);
      
      if (response.data.success) {
        setSuccess({
          message: `Appointment ID: ${response.data.appointmentId}`,
          fhirResource: response.data.fhirResource || fhirPayload
        });
        
        // Reset form
        setTimeout(() => {
          const now = new Date();
          const start = new Date(now.getTime() + 60 * 60 * 1000);
          const end = new Date(start.getTime() + 45 * 60 * 1000);
          
          setFormData({
            status: 'booked',
            priority: '0',
            serviceTypeCode: '',
            serviceTypeDisplay: '',
            serviceTypeText: '',
            reasonText: '',
            reasonCode: '',
            reasonDisplay: '',
            start: formatDateTime(start),
            end: formatDateTime(end),
            minutesDuration: '45',
            comment: '',
            patientId: '',
            patientName: '',
            practitionerId: '',
            practitionerName: '',
            locationId: '',
            locationName: '',
            created: now.toISOString()
          });
          
          setSelectedProcedure(null);
          setSelectedDiagnosis(null);
          
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
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    
    const sampleData = {
      status: 'booked',
      priority: '1',
      serviceTypeCode: 'KBO.JB.AE',
      serviceTypeDisplay: 'Percutaneous drainage of appendix',
      serviceTypeText: 'Percutaneous drainage of appendix',
      reasonText: 'Acute appendicitis',
      reasonCode: 'DA03.0',
      reasonDisplay: 'Acute appendicitis',
      start: formatDateTime(start),
      end: formatDateTime(end),
      minutesDuration: '45',
      comment: 'Anaesthesia appointment for acute appendicitis case',
      patientId: 'P001',
      patientName: 'မောင်သူရိန်လင်း',
      practitionerId: 'DOC001',
      practitionerName: 'Dr. Aung Ko Win',
      locationId: 'OR1',
      locationName: 'Operating Room 1',
      created: now.toISOString()
    };

    setFormData(sampleData);
    
    // Set sample procedure
    setSelectedProcedure({
      Code: 'KBO.JB.AE',
      Title: 'Percutaneous drainage of appendix',
      Description: 'Percutaneous drainage procedure for appendix'
    });
    
    // Set sample diagnosis (ICD-11 code for acute appendicitis)
    setSelectedDiagnosis({
      Code: 'DA03.0',
      Title: 'Acute appendicitis',
      Description: 'Acute inflammation of the appendix',
      Chapter: 'Diseases of the digestive system'
    });
  };

  const clearAllFields = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    
    setFormData({
      status: 'booked',
      priority: '0',
      serviceTypeCode: '',
      serviceTypeDisplay: '',
      serviceTypeText: '',
      reasonText: '',
      reasonCode: '',
      reasonDisplay: '',
      start: formatDateTime(start),
      end: formatDateTime(end),
      minutesDuration: '45',
      comment: '',
      patientId: '',
      patientName: '',
      practitionerId: '',
      practitionerName: '',
      locationId: '',
      locationName: '',
      created: now.toISOString()
    });
    
    setSelectedProcedure(null);
    setSelectedDiagnosis(null);
    setSuccess(null);
    setError(null);
  };

  // Custom diagnosis search function for ICD-11
  const searchICD11 = async (query) => {
    try {
      const response = await axios.get(`http://localhost/api/icd/search?q=${encodeURIComponent(query)}&limit=100`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching ICD-11:', error);
      return [];
    }
  };

  return (
    <div className="tab-content active">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Appointment Details */}
          <div className="section-info">
            <h3><i className="fas fa-calendar-alt"></i> Appointment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="booked">Booked</option>
                  <option value="pending">Pending</option>
                  <option value="proposed">Proposed</option>
                  <option value="arrived">Arrived</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="noshow">No Show</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority *</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                >
                  <option value="0">Routine (0)</option>
                  <option value="1">Urgent (1)</option>
                  <option value="2">ASAP (2)</option>
                  <option value="3">STAT (3)</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  id="start"
                  name="start"
                  value={formData.start}
                  onChange={handleInputChange}
                  onBlur={calculateDuration}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="end">End Date & Time *</label>
                <input
                  type="datetime-local"
                  id="end"
                  name="end"
                  value={formData.end}
                  onChange={handleInputChange}
                  onBlur={calculateDuration}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minutesDuration">Duration (minutes) *</label>
                <input
                  type="number"
                  id="minutesDuration"
                  name="minutesDuration"
                  value={formData.minutesDuration}
                  onChange={handleInputChange}
                  required
                  min="15"
                  max="480"
                  placeholder="e.g., 45"
                />
              </div>
              <div className="form-group">
                <label htmlFor="created">Created Date & Time</label>
                <input
                  type="datetime-local"
                  id="created"
                  name="created"
                  value={formData.created.slice(0, 16)}
                  onChange={(e) => setFormData(prev => ({ ...prev, created: e.target.value + ':00' }))}
                />
              </div>
            </div>
          </div>

          {/* Service Type (Procedure) */}
<div className="section-info">
  <h3><i className="fas fa-procedures"></i> Service Type / Procedure (ICHI)</h3>
  <div className="form-row">
    <div className="form-group">
      <label>Procedure Search (ICHI)</label>
      <Autocomplete
        value={formData.serviceTypeText}
        onChange={(value) => setFormData(prev => ({ 
          ...prev, 
          serviceTypeText: value 
        }))}
        onProcedureSelect={handleProcedureSelect}
        onClear={handleClearProcedure}
        placeholder="Search procedures (ICHI coding)..."
        searchType="procedure"
        searchUrl="http://localhost/api/ichi/search?q="
      />
    </div>
  </div>
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="serviceTypeCode">Procedure Code</label>
      <input
        type="text"
        id="serviceTypeCode"
        name="serviceTypeCode"
        value={formData.serviceTypeCode}
        onChange={handleInputChange}
        placeholder="e.g., KBO.JB.AE"
      />
    </div>
  </div>
</div>

{/* Reason (Diagnosis) */}
<div className="section-info">
  <h3><i className="fas fa-stethoscope"></i> Reason / Diagnosis (ICD-11)</h3>
  <div className="form-row">
    <div className="form-group">
      <label>Diagnosis Search (ICD-11)</label>
      <Autocomplete
        value={formData.reasonText}
        onChange={(value) => setFormData(prev => ({ 
          ...prev, 
          reasonText: value 
        }))}
        onProcedureSelect={handleDiagnosisSelect}
        onClear={handleClearDiagnosis}
        placeholder="Search diagnoses (ICD-11 coding)..."
        searchType="diagnosis"
        searchUrl="http://localhost/api/icd/search?q="
        searchFunction={searchICD11}
        customSearch={true}
      />
      <p className="help-text">
        <i className="fas fa-info-circle"></i> Search for ICD-11 diagnosis codes. Example: "appendicitis", "diabetes", "hypertension"
      </p>
    </div>
  </div>
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="reasonCode">Diagnosis Code (ICD-11)</label>
      <input
        type="text"
        id="reasonCode"
        name="reasonCode"
        value={formData.reasonCode}
        onChange={handleInputChange}
        placeholder="e.g., DA03.0, 5A20.0Z"
        readOnly={!!selectedDiagnosis}
        className={selectedDiagnosis ? 'readonly-field' : ''}
      />
      {selectedDiagnosis && (
        <p className="field-info">
          <i className="fas fa-check"></i> Code from search: {formData.reasonCode}
        </p>
      )}
    </div>
  </div>
</div>


          {/* Participants */}
          <div className="section-info">
            <h3><i className="fas fa-users"></i> Participants</h3>
            
            <h4><i className="fas fa-user"></i> Patient</h4>
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

            <h4><i className="fas fa-user-md"></i> Practitioner</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="practitionerId">Practitioner ID *</label>
                <input
                  type="text"
                  id="practitionerId"
                  name="practitionerId"
                  value={formData.practitionerId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., DOC001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="practitionerName">Practitioner Name *</label>
                <input
                  type="text"
                  id="practitionerName"
                  name="practitionerName"
                  value={formData.practitionerName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Dr. Aung Ko Win"
                />
              </div>
            </div>

            <h4><i className="fas fa-hospital"></i> Location</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="locationId">Location ID *</label>
                <input
                  type="text"
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., OR1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="locationName">Location Name *</label>
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Operating Room 1"
                />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="section-info">
            <h3><i className="fas fa-comment"></i> Comment</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="comment">Comment</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Enter appointment comment or notes..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  <i className="fas fa-spinner fa-spin"></i> Book Appointment...
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
            <p>Creating FHIR Appointment resource...</p>
          </div>
        )}

        {success && (
          <div className="result-container success">
            <h3><i className="fas fa-check-circle"></i> Appointment Booked Successfully!</h3>
            <p>{success.message}</p>
            <h4>FHIR Appointment Resource:</h4>
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