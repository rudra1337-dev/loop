import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (value) => {
    setTheme(value);
    setIsOpen(false);
  };

  const currentOption = options.find(opt => opt.value === theme) || options[2];

  return (
    <div className="theme-selector-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change theme. Current: ${theme}`}
        type="button"
      >
        <span className="theme-icon" aria-hidden="true">{currentOption.icon}</span>
        <span className="theme-label">{currentOption.label}</span>
        <span className="theme-chevron" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <ul className="theme-options-list" role="listbox" aria-label="Theme options">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`theme-option-item ${theme === option.value ? 'active' : ''}`}
              role="option"
              aria-selected={theme === option.value}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(option.value);
                }
              }}
            >
              <span className="option-icon" aria-hidden="true">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              {theme === option.value && <span className="option-checkmark" aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemeSelector;
