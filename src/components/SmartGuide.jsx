import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function SmartGuide() {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('manual'); // 'manual' or 'auto'
  const [steps, setSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0, show: false });
  const [cursor, setCursor] = useState({ x: -100, y: -100, show: false });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, position: 'bottom' });
  const [isSimulating, setIsSimulating] = useState(false);
  
  const location = useLocation();

  // Shut down tour if user manually navigates to a new page
  useEffect(() => {
    if (isActive) {
      setIsActive(false);
      setCurrentIndex(-1);
      setSpotlight({ show: false });
      setCursor(c => ({ ...c, show: false }));
      setSteps([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isGuideElement = (el) => el.closest('.smart-guide-container');

  const scanPage = useCallback(() => {
    // Gather all interactive or tour-specific elements in strict DOM order
    const selectors = 'h1, h2, h3, button, input, select, textarea, a[href], [role="button"], [role="tab"], [data-tour]';
    
    // Restrict scanning to the <main> element so we ignore global Sidebars and Headers
    const mainContent = document.querySelector('main') || document;
    
    let elements = Array.from(mainContent.querySelectorAll(selectors)).filter(el => {
      if (isGuideElement(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && !el.disabled;
    });

    const newSteps = elements.map((el, i) => {
      const id = `guide-step-${Date.now()}-${i}`;
      el.setAttribute('data-smartguide-target', id);
      
      const tagName = el.tagName.toLowerCase();
      const type = el.type || tagName;
      
      const textContent = el.innerText?.trim() || el.value || el.placeholder || el.name || el.id || el.getAttribute('aria-label') || '';
      
      let title = el.getAttribute('data-tour-title') || textContent.slice(0, 30) || type;
      if (!title) title = 'Interactive Element';
      
      let action = 'click';
      let description = el.getAttribute('data-tour-desc');
      
      if (!description) {
        if (['h1', 'h2', 'h3'].includes(tagName)) {
          action = 'highlight';
          title = 'Section: ' + title;
          description = 'Pay attention to this section of the application.';
        } else if (tagName === 'input' || tagName === 'textarea') {
          action = type === 'checkbox' || type === 'radio' ? 'click' : 'type';
          description = `Enter or verify information in this ${type} field.`;
        } else if (tagName === 'select') {
          action = 'select';
          description = 'Choose an option from the dropdown menu.';
        } else if (tagName === 'a') {
          action = 'navigate';
          description = 'This link navigates to another part of the application.';
        } else if (el.hasAttribute('data-tour')) {
          action = 'highlight';
          description = 'Review this section for more details.';
        } else {
          description = `Click this ${tagName} to interact.`;
        }
      } else {
        if (el.hasAttribute('data-tour') && !['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
          action = 'highlight';
        }
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

  const toggleGuide = () => {
    if (isActive) {
      setIsActive(false);
      setCurrentIndex(-1);
      setSpotlight({ show: false });
      setCursor(c => ({ ...c, show: false }));
    } else {
      setIsActive(true);
      setTimeout(() => scanPage(), 100);
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
          top: rect.top + window.scrollY - 6,
          left: rect.left + window.scrollX - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          show: true
        });

        const tooltipWidth = 340;
        const tooltipHeight = 180;
        let tTop = rect.top + window.scrollY + rect.height + 24;
        let tLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let pos = 'bottom';

        if (tTop + tooltipHeight > window.scrollY + window.innerHeight) {
          tTop = rect.top + window.scrollY - tooltipHeight - 24;
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
    if (isActive) updateHighlight();
  }, [currentIndex, isActive, updateHighlight]);

  const handleNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsActive(false);
      setCurrentIndex(-1);
      alert("Page Tour Complete!");
    }
  }, [currentIndex, steps.length]);

  const simulateAction = useCallback(async () => {
    if (currentIndex < 0 || currentIndex >= steps.length) return;
    setIsSimulating(true);
    const step = steps[currentIndex];
    const el = getElement(step.targetId);
    
    if (!el) {
      setIsSimulating(false);
      return handleNext();
    }

    if (step.action === 'highlight') {
      await new Promise(r => setTimeout(r, 600));
      setIsSimulating(false);
      return handleNext();
    }

    const rect = el.getBoundingClientRect();
    setCursor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, show: true });
    
    await new Promise(r => setTimeout(r, 600));

    if (step.action === 'type') {
      el.focus();
      const text = "Demo Input";
      el.value = "";
      for (let i = 0; i < text.length; i++) {
        el.value += text[i];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 80));
      }
    } else if (step.action === 'select') {
      el.focus();
      if (el.options && el.options.length > 1) {
        el.selectedIndex = 1;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Visual click effect
      const originalTransition = el.style.transition || '';
      const originalTransform = el.style.transform || '';
      el.style.transition = 'transform 0.1s ease';
      el.style.transform = 'scale(0.95)';
      
      await new Promise(r => setTimeout(r, 150));
      
      // Crucial: Prevent leaving the page during the tour
      const preventDefaultHandler = (e) => {
        if (step.tagName === 'a' || step.type === 'submit') {
          e.preventDefault();
        }
      };
      el.addEventListener('click', preventDefaultHandler);
      el.focus();
      el.click();
      setTimeout(() => el.removeEventListener('click', preventDefaultHandler), 100);

      el.style.transform = originalTransform;
      el.style.transition = originalTransition;
    }

    await new Promise(r => setTimeout(r, 500));
    setCursor(prev => ({ ...prev, show: false }));
    setIsSimulating(false);
    
    handleNext();
  }, [currentIndex, steps, handleNext]);

  // Auto-Play Engine
  useEffect(() => {
    if (!isActive || isSimulating || currentIndex < 0 || mode !== 'auto') return;
    
    // In auto mode, give the user a moment to read, then simulate and advance
    const timer = setTimeout(() => {
      simulateAction();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isActive, isSimulating, currentIndex, mode, simulateAction]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!isActive || isSimulating) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') toggleGuide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, currentIndex, isSimulating, handleNext]);

  return (
    <div className="smart-guide-container">
      <style>{`
        .sg-overlay { position: fixed; inset: 0; z-index: 9990; pointer-events: none; }
        .sg-spotlight {
          position: absolute;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.65);
          border-radius: 8px;
          border: 2px solid #6366f1;
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
          width: 340px;
          background: white;
          border-radius: 12px;
          padding: 24px;
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
          padding: 10px 16px;
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
                style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} 
              />
            )}
          </div>

          {spotlight.show && steps[currentIndex] && (
            <div 
              className="sg-tooltip"
              data-pos={tooltipPos.position}
              style={{ top: tooltipPos.top, left: tooltipPos.left }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                  STEP {currentIndex + 1} OF {steps.length}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    style={{ fontSize: 12, padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#f8fafc', color: '#334155', fontWeight: 500 }}
                  >
                    <option value="manual">Manual Mode</option>
                    <option value="auto">Auto-Play</option>
                  </select>
                  <button 
                    onClick={toggleGuide}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0f172a', textTransform: 'capitalize' }}>
                {steps[currentIndex].title}
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                {steps[currentIndex].description}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  className="sg-btn sg-btn-primary" 
                  style={{ flex: 1 }}
                  onClick={simulateAction}
                  disabled={isSimulating || mode === 'auto'}
                >
                  {isSimulating ? 'Simulating...' : (steps[currentIndex].action === 'highlight' ? 'Acknowledge & Next' : 'Simulate & Next')}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button 
                  className="sg-btn sg-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isSimulating || mode === 'auto'}
                >
                  Previous
                </button>
                <button 
                  className="sg-btn sg-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={handleNext}
                  disabled={isSimulating || mode === 'auto'}
                >
                  {currentIndex === steps.length - 1 ? 'Finish Page' : 'Skip Step'}
                </button>
              </div>
            </div>
          )}

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