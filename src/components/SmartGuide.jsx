import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SmartGuide() {
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0, show: false });
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, show: false });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, position: 'bottom' });
  const [isSimulating, setIsSimulating] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Exclude guide elements
  const isGuideElement = (el) => el.closest('.smart-guide-container');

  const scanPage = useCallback(() => {
    const selectors = 'button, input, select, textarea, a[href], [role="button"], [role="tab"], [data-guide]';
    const elements = Array.from(document.querySelectorAll(selectors)).filter(el => {
      if (isGuideElement(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && !el.disabled;
    });

    const newSteps = elements.map((el, i) => {
      const id = `guide-step-${Date.now()}-${i}`;
      el.setAttribute('data-smartguide-target', id);
      
      const tagName = el.tagName.toLowerCase();
      const type = el.type || tagName;
      
      // Attempt to find a meaningful title
      let title = el.innerText?.trim().slice(0, 30) || el.placeholder || el.name || el.getAttribute('aria-label') || type;
      if (!title) title = 'Interactive Element';
      
      let action = 'click';
      let description = `Click this ${tagName} to proceed.`;
      
      if (tagName === 'input' || tagName === 'textarea') {
        if (type === 'checkbox' || type === 'radio') {
          action = 'click';
          description = `Toggle this ${type}.`;
        } else {
          action = 'type';
          description = `Enter information in this ${type} field.`;
        }
      } else if (tagName === 'select') {
        action = 'select';
        description = 'Select an option from this dropdown.';
      } else if (tagName === 'a') {
        action = 'navigate';
        description = 'Click this link to navigate.';
      }

      return { id, targetId: id, title, description, action, tagName, type };
    });

    setSteps(newSteps);
    if (newSteps.length > 0) {
      setCurrentIndex(0);
    } else {
      setSpotlight({ show: false });
    }
  }, []);

  // When active and route changes, rescan
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => {
      scanPage();
    }, 800); // Wait for page render
    return () => clearTimeout(timer);
  }, [isActive, location.pathname, scanPage]);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem('smartGuideState');
    if (saved) {
      try {
        const { active } = JSON.parse(saved);
        if (active) {
          setIsActive(true);
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartGuideState', JSON.stringify({ active: isActive }));
  }, [isActive]);

  const toggleGuide = () => {
    if (isActive) {
      setIsActive(false);
      setCurrentIndex(-1);
      setSpotlight({ show: false });
      setCursor({ ...cursor, show: false });
    } else {
      setIsActive(true);
    }
  };

  const getElement = (targetId) => document.querySelector(`[data-smartguide-target="${targetId}"]`);

  const updateHighlight = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= steps.length) return;
    const step = steps[currentIndex];
    const el = getElement(step.targetId);
    
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setSpotlight({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          show: true
        });

        // Calculate tooltip pos
        const tooltipWidth = 320;
        const tooltipHeight = 150;
        let tTop = rect.top + window.scrollY + rect.height + 16;
        let tLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let pos = 'bottom';

        if (tTop + tooltipHeight > window.scrollY + window.innerHeight) {
          tTop = rect.top + window.scrollY - tooltipHeight - 16;
          pos = 'top';
        }
        if (tLeft < 16) tLeft = 16;
        if (tLeft + tooltipWidth > window.innerWidth - 16) tLeft = window.innerWidth - tooltipWidth - 16;

        setTooltipPos({ top: tTop, left: tLeft, position: pos });
      }, 300);
    } else {
      setSpotlight({ show: false });
    }
  }, [currentIndex, steps]);

  useEffect(() => {
    if (isActive) {
      updateHighlight();
    }
  }, [currentIndex, isActive, updateHighlight]);

  const simulateAction = async () => {
    if (currentIndex < 0 || currentIndex >= steps.length) return;
    setIsSimulating(true);
    const step = steps[currentIndex];
    const el = getElement(step.targetId);
    
    if (!el) {
      setIsSimulating(false);
      return handleNext();
    }

    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    // Move cursor
    setCursor({ x: targetX, y: targetY, show: true });
    
    await new Promise(r => setTimeout(r, 600)); // wait for cursor to arrive

    // Simulate interactions
    if (step.action === 'type') {
      el.focus();
      const text = "Demo Input";
      el.value = "";
      for (let i = 0; i < text.length; i++) {
        el.value += text[i];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 100));
      }
    } else if (step.action === 'select') {
      el.focus();
      if (el.options && el.options.length > 1) {
        el.selectedIndex = 1;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Click or Navigate
      el.focus();
      await new Promise(r => setTimeout(r, 200));
      el.click();
    }

    await new Promise(r => setTimeout(r, 500));
    setCursor(prev => ({ ...prev, show: false }));
    setIsSimulating(false);
    
    // If it was a navigation, the useEffect will trigger scanPage when route changes
    // Otherwise, we just go to next
    if (step.action !== 'navigate' && step.type !== 'submit') {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsActive(false);
      setCurrentIndex(-1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKey = (e) => {
      if (!isActive) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') toggleGuide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, currentIndex]);

  return (
    <div className="smart-guide-container">
      <style>{`
        .sg-overlay { position: fixed; inset: 0; z-index: 9990; pointer-events: none; }
        .sg-spotlight {
          position: absolute;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
          border-radius: 8px;
          transition: all 0.4s ease-in-out;
          pointer-events: none;
          z-index: 9991;
        }
        .sg-cursor {
          position: fixed;
          width: 24px;
          height: 24px;
          z-index: 9999;
          transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          pointer-events: none;
          margin-top: 10px;
          margin-left: 10px;
        }
        .sg-tooltip {
          position: absolute;
          width: 320px;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          z-index: 9995;
          transition: all 0.4s ease-in-out;
          font-family: system-ui, sans-serif;
        }
        .sg-tooltip::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: white;
          transform: rotate(45deg);
        }
        .sg-tooltip[data-pos="bottom"]::before { top: -8px; left: 50%; margin-left: -8px; }
        .sg-tooltip[data-pos="top"]::before { bottom: -8px; left: 50%; margin-left: -8px; }
        .sg-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #6366f1;
          color: white;
          border-radius: 50px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          border: none;
          font-weight: 600;
          font-family: system-ui, sans-serif;
          transition: transform 0.2s;
        }
        .sg-fab:hover { transform: scale(1.05); }
        .sg-btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: opacity 0.2s;
        }
        .sg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sg-btn-primary { background: #6366f1; color: white; }
        .sg-btn-secondary { background: #f1f5f9; color: #475569; }
      `}</style>

      {/* Floating Action Button */}
      <button className="sg-fab" onClick={toggleGuide}>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
        </svg>
        {isActive ? 'Stop Guide' : 'Smart Guide'}
      </button>

      {isActive && (
        <>
          <div className="sg-overlay">
            {spotlight.show && (
              <div 
                className="sg-spotlight"
                style={{ 
                  top: spotlight.top, 
                  left: spotlight.left, 
                  width: spotlight.width, 
                  height: spotlight.height 
                }} 
              />
            )}
          </div>

          {spotlight.show && steps[currentIndex] && (
            <div 
              className="sg-tooltip"
              data-pos={tooltipPos.position}
              style={{ top: tooltipPos.top, left: tooltipPos.left }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  STEP {currentIndex + 1} OF {steps.length}
                </span>
                <button 
                  onClick={toggleGuide}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              </div>
              
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0f172a', textTransform: 'capitalize' }}>
                {steps[currentIndex].title}
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                {steps[currentIndex].description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  className="sg-btn sg-btn-primary" 
                  style={{ flex: 1 }}
                  onClick={simulateAction}
                  disabled={isSimulating}
                >
                  {isSimulating ? 'Simulating...' : 'Simulate & Next'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button 
                  className="sg-btn sg-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isSimulating}
                >
                  Previous
                </button>
                <button 
                  className="sg-btn sg-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={handleNext}
                  disabled={currentIndex === steps.length - 1 || isSimulating}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Animated Cursor */}
          <svg 
            className="sg-cursor"
            style={{ 
              top: cursor.y, 
              left: cursor.x,
              opacity: cursor.show ? 1 : 0,
              transform: `scale(${isSimulating ? 0.9 : 1})`
            }}
            viewBox="0 0 24 24" 
            fill="black" 
            stroke="white" 
            strokeWidth="2"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </>
      )}
    </div>
  );
}