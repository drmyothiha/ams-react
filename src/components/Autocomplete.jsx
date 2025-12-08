import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Autocomplete = ({ value, onChange, onProcedureSelect, onClear, placeholder }) => {
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

  const searchProcedures = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchStatus(`Please enter at least 2 characters to search`);
      return;
    }

    setIsLoading(true);
    setSearchStatus('Searching...');

    try {
      // For testing - use sample data if API fails
      let results = [];
      
      try {
        const response = await axios.get(`http://localhost/api/ichi/search?q=${encodeURIComponent(query)}&limit=100`);
        results = response.data.results || [];
      } catch (apiError) {
        console.log('API call failed, using sample data:', apiError);
        // Fallback to sample data
        results = getSampleProcedures(query);
      }

      setSearchResults(results);
      
      if (results.length > 0) {
        setShowDropdown(true);
        setSearchStatus(`Found ${results.length} procedure(s). Use arrow keys ↑↓ to navigate, Enter to select.`);
      } else {
        setShowDropdown(false);
        setSearchStatus(`No procedures found for "${query}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchStatus('Search failed. Using sample data...');
      // Fallback to sample data
      const sampleResults = getSampleProcedures(query);
      setSearchResults(sampleResults);
      if (sampleResults.length > 0) {
        setShowDropdown(true);
        setSearchStatus(`Found ${sampleResults.length} procedure(s) from sample data.`);
      } else {
        setShowDropdown(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample procedure data for fallback
  const getSampleProcedures = (query) => {
    const sampleProcedures = [
      { Code: '001', Title: 'Appendectomy', Description: 'Surgical removal of the appendix' },
      { Code: '002', Title: 'Cholecystectomy', Description: 'Gallbladder removal surgery' },
      { Code: '003', Title: 'Colonoscopy', Description: 'Examination of the colon' },
      { Code: '004', Title: 'Mastectomy', Description: 'Breast tissue removal' },
      { Code: '005', Title: 'Hysterectomy', Description: 'Uterus removal surgery' },
      { Code: '006', Title: 'Angioplasty', Description: 'Heart artery widening procedure' },
      { Code: '007', Title: 'Cataract Surgery', Description: 'Eye lens replacement' },
      { Code: '008', Title: 'Total Hip Replacement', Description: 'Hip joint replacement surgery' },
      { Code: '009', Title: 'Knee Arthroscopy', Description: 'Knee joint examination' },
      { Code: '010', Title: 'Tonsillectomy', Description: 'Tonsil removal surgery' },
      { Code: '011', Title: 'Cesarean Section', Description: 'C-section delivery' },
      { Code: '012', Title: 'Laparoscopy', Description: 'Minimally invasive abdominal surgery' },
      { Code: '013', Title: 'Biopsy', Description: 'Tissue sample collection' },
      { Code: '014', Title: 'MRI Scan', Description: 'Magnetic Resonance Imaging' },
      { Code: '015', Title: 'CT Scan', Description: 'Computed Tomography scan' }
    ];

    if (!query) return sampleProcedures;

    const searchTerm = query.toLowerCase();
    return sampleProcedures.filter(procedure =>
      procedure.Title.toLowerCase().includes(searchTerm) ||
      procedure.Code.toLowerCase().includes(searchTerm) ||
      (procedure.Description && procedure.Description.toLowerCase().includes(searchTerm))
    );
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Clear selected procedure if user starts typing manually
    if (value !== newValue) {
      onClear?.();
      setSelectedIndex(-1);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchProcedures(newValue.trim());
    }, 300);
  };

  const handleProcedureClick = (procedure) => {
    onChange(procedure.Title);
    onProcedureSelect(procedure);
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSearchStatus(`Selected: ${procedure.Code} - ${procedure.Title}`);
    setSearchQuery(procedure.Title);
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
          handleProcedureClick(searchResults[selectedIndex]);
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
      searchProcedures(searchQuery.trim());
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

  return (
    <div className="form-group autocomplete-container" ref={containerRef}>
      <label htmlFor="diagnosis">Procedure / Diagnosis</label>
      <div className="autocomplete-wrapper" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          id="diagnosis"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.length >= 2 && searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
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
            title="Search procedures"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>
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
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          {searchResults.map((item, index) => (
            <div
              key={`${item.Code}-${index}`}
              className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleProcedureClick(item)}
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
                <span style={{
                  fontWeight: 'bold',
                  color: index === selectedIndex ? 'white' : '#3b82f6',
                  fontSize: '12px',
                  minWidth: '40px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.2)' : '#f3f4f6'
                }}>
                  {item.Code}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {highlightText(item.Title, searchQuery.trim())}
                  </div>
                  {item.Description && (
                    <div style={{
                      fontSize: '12px',
                      color: index === selectedIndex ? 'rgba(255,255,255,0.9)' : '#6b7280'
                    }}>
                      {item.Description}
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