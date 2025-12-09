import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Autocomplete = ({ 
  value, 
  onChange, 
  onProcedureSelect, 
  onClear, 
  placeholder,
  searchType = 'procedure', // 'procedure' for ICHI, 'diagnosis' for ICD-11
  searchUrl,
  searchFunction,
  customSearch = false
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Initialize search query from value prop
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const searchItems = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchStatus(`Please enter at least 2 characters to search`);
      return;
    }

    setIsLoading(true);
    setSearchStatus('Searching...');

    try {
      let results = [];
      
      if (customSearch && searchFunction) {
        // Use custom search function if provided
        results = await searchFunction(query);
      } else if (searchUrl) {
        // Use provided search URL
        const response = await axios.get(`${searchUrl}${encodeURIComponent(query)}&limit=100`);
        results = response.data.results || response.data || [];
      } else {
        // Default search based on searchType
        if (searchType === 'procedure') {
          const response = await axios.get(`http://localhost/api/ichi/search?q=${encodeURIComponent(query)}&limit=100`);
          results = response.data.results || [];
        } else if (searchType === 'diagnosis') {
          const response = await axios.get(`http://localhost/api/icd/search?q=${encodeURIComponent(query)}&limit=100`);
          results = response.data.results || [];
        }
      }

      // Fallback to sample data if no results
      if (results.length === 0) {
        results = getSampleItems(query);
      }

      setSearchResults(results);
      
      if (results.length > 0) {
        setShowDropdown(true);
        setSearchStatus(`Found ${results.length} item(s). Use arrow keys ↑↓ to navigate, Enter to select.`);
      } else {
        setShowDropdown(false);
        setSearchStatus(`No ${searchType === 'procedure' ? 'procedures' : 'diagnoses'} found for "${query}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchStatus(`Search failed. Using sample data...`);
      // Fallback to sample data
      const sampleResults = getSampleItems(query);
      setSearchResults(sampleResults);
      if (sampleResults.length > 0) {
        setShowDropdown(true);
        setSearchStatus(`Found ${sampleResults.length} item(s) from sample data.`);
      } else {
        setShowDropdown(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for fallback
  const getSampleItems = (query) => {
    if (searchType === 'procedure') {
      const sampleProcedures = [
        { Code: 'KBO.JB.AE', Title: 'Percutaneous drainage of appendix', Description: 'Drainage procedure for appendix' },
        { Code: 'KBO.JB.AF', Title: 'Laparoscopic appendectomy', Description: 'Minimally invasive appendix removal' },
        { Code: 'KBO.JB.AG', Title: 'Open appendectomy', Description: 'Traditional open surgery for appendix removal' },
        { Code: 'KBP.JB.BA', Title: 'Cholecystectomy', Description: 'Gallbladder removal surgery' },
        { Code: 'KBP.JB.BB', Title: 'Laparoscopic cholecystectomy', Description: 'Minimally invasive gallbladder removal' },
        { Code: 'KBR.JB.CA', Title: 'Colonoscopy', Description: 'Examination of the colon' },
        { Code: 'KBS.JB.DA', Title: 'Mastectomy', Description: 'Breast tissue removal' },
        { Code: 'KBT.JB.EA', Title: 'Hysterectomy', Description: 'Uterus removal surgery' },
        { Code: 'KBU.JB.FA', Title: 'Angioplasty', Description: 'Heart artery widening procedure' },
        { Code: 'KBV.JB.GA', Title: 'Cataract Surgery', Description: 'Eye lens replacement' }
      ];

      if (!query) return sampleProcedures;

      const searchTerm = query.toLowerCase();
      return sampleProcedures.filter(item =>
        item.Title.toLowerCase().includes(searchTerm) ||
        item.Code.toLowerCase().includes(searchTerm) ||
        (item.Description && item.Description.toLowerCase().includes(searchTerm))
      );
    } else {
      // Diagnosis sample data (ICD-11)
      const sampleDiagnoses = [
        { Code: 'DA03.0', Title: 'Acute appendicitis', Description: 'Acute inflammation of the appendix' },
        { Code: 'DA03.1', Title: 'Chronic appendicitis', Description: 'Chronic inflammation of the appendix' },
        { Code: 'DA03.Y', Title: 'Other specified appendicitis', Description: 'Other forms of appendicitis' },
        { Code: '5A20.0Z', Title: 'Type 2 diabetes mellitus', Description: 'Adult-onset diabetes' },
        { Code: '5A20.00', Title: 'Type 1 diabetes mellitus', Description: 'Insulin-dependent diabetes' },
        { Code: 'BA00.Z', Title: 'Essential (primary) hypertension', Description: 'High blood pressure' },
        { Code: 'BA01.Z', Title: 'Secondary hypertension', Description: 'Hypertension due to other conditions' },
        { Code: 'CA60.Z', Title: 'Malignant neoplasm of breast', Description: 'Breast cancer' },
        { Code: 'CA61.Z', Title: 'Malignant neoplasm of lung', Description: 'Lung cancer' },
        { Code: 'DA92.Z', Title: 'Gastritis', Description: 'Inflammation of stomach lining' }
      ];

      if (!query) return sampleDiagnoses;

      const searchTerm = query.toLowerCase();
      return sampleDiagnoses.filter(item =>
        item.Title.toLowerCase().includes(searchTerm) ||
        item.Code.toLowerCase().includes(searchTerm) ||
        (item.Description && item.Description.toLowerCase().includes(searchTerm))
      );
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Clear selected item if user starts typing manually
    if (value !== newValue) {
      onClear?.();
      setSelectedIndex(-1);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchItems(newValue.trim());
    }, 300);
  };

  const handleItemClick = (item) => {
    onChange(item.Title);
    onProcedureSelect(item);
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSearchStatus(`Selected: ${item.Code} - ${item.Title}`);
    setSearchQuery(item.Title);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !showDropdown) {
      // If Enter pressed and dropdown not shown, submit the form
      return;
    }

    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
          // Scroll into view
          const dropdown = containerRef.current?.querySelector('.autocomplete-dropdown');
          const selectedItem = dropdown?.children[newIndex];
          selectedItem?.scrollIntoView({ block: 'nearest' });
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : searchResults.length - 1;
          // Scroll into view
          const dropdown = containerRef.current?.querySelector('.autocomplete-dropdown');
          const selectedItem = dropdown?.children[newIndex];
          selectedItem?.scrollIntoView({ block: 'nearest' });
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleItemClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    setSearchResults([]);
    setShowDropdown(false);
    setSearchStatus('');
    setSelectedIndex(-1);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSearchClick = () => {
    if (searchQuery.trim().length >= 2) {
      searchItems(searchQuery.trim());
    } else {
      inputRef.current?.focus();
    }
  };

  const highlightText = (text, query) => {
    if (!query || query.length < 2) return text;
    
    try {
      const regex = new RegExp(`(${query})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? 
          <span key={i} className="highlight" style={{ backgroundColor: '#fef3c7', fontWeight: 'bold' }}>{part}</span> : part
      );
    } catch (error) {
      // If regex fails (special characters), just return the text
      return text;
    }
  };

  const getSystemInfo = () => {
    if (searchType === 'procedure') {
      return { system: 'ICHI', url: 'https://icd.who.int/devct11/ichi/en/current' };
    } else {
      return { system: 'ICD-11', url: 'http://hl7.org/fhir/sid/icd-11' };
    }
  };

  const systemInfo = getSystemInfo();

  return (
    <div className="form-group autocomplete-container" ref={containerRef}>
      <div className="autocomplete-wrapper" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.length >= 2 && searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder || `Search ${systemInfo.system} ${searchType === 'procedure' ? 'procedures' : 'diagnoses'}...`}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '10px 40px 10px 15px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '5px'
        }}>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '16px',
                padding: '4px'
              }}
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          <button
            type="button"
            onClick={handleSearchClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isLoading ? '#3b82f6' : '#6b7280',
              fontSize: '16px',
              padding: '4px'
            }}
            title={`Search ${systemInfo.system} ${searchType === 'procedure' ? 'procedures' : 'diagnoses'}`}
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>
      </div>
      
      <div className="system-info" style={{
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          <i className="fas fa-database"></i> {systemInfo.system} System
        </span>
        {searchType === 'procedure' && (
          <span title="ICHI - International Classification of Health Interventions">
            <i className="fas fa-info-circle"></i> ICHI
          </span>
        )}
        {searchType === 'diagnosis' && (
          <span title="ICD-11 - International Classification of Diseases 11th Revision">
            <i className="fas fa-info-circle"></i> ICD-11
          </span>
        )}
      </div>
      
      {showDropdown && searchResults.length > 0 && (
        <div 
          className="autocomplete-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            marginTop: '2px'
          }}
        >
          {searchResults.map((item, index) => (
            <div
              key={`${item.Code}-${index}`}
              className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '12px 15px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: index === selectedIndex ? '#3b82f6' : 'white',
                color: index === selectedIndex ? 'white' : '#374151',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: index === selectedIndex ? 'white' : '#3b82f6',
                    fontSize: '11px',
                    minWidth: '60px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    textAlign: 'center'
                  }}>
                    {item.Code}
                  </span>
                  {searchType === 'diagnosis' && item.Code && item.Code.includes('.') && (
                    <span style={{
                      fontSize: '9px',
                      color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      textAlign: 'center'
                    }}>
                      ICD-11
                    </span>
                  )}
                  {searchType === 'procedure' && item.Code && item.Code.includes('.') && (
                    <span style={{
                      fontSize: '9px',
                      color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      textAlign: 'center'
                    }}>
                      ICHI
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {highlightText(item.Title, searchQuery.trim())}
                  </div>
                  {item.Description && (
                    <div style={{
                      fontSize: '12px',
                      color: index === selectedIndex ? 'rgba(255,255,255,0.9)' : '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {item.Description}
                    </div>
                  )}
                  {item.Chapter && (
                    <div style={{
                      fontSize: '11px',
                      color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      marginTop: '4px',
                      fontStyle: 'italic'
                    }}>
                      <i className="fas fa-book"></i> {item.Chapter}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchStatus && (
        <div className="autocomplete-status" style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '8px',
          minHeight: '18px'
        }}>
          {searchStatus}
          {isLoading && (
            <span style={{ marginLeft: '8px' }}>
              <i className="fas fa-spinner fa-spin"></i>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;