import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SAMPLE_STEPS = [
  {
    id: 1,
    route: '/',
    selector: 'h2',
    title: 'Welcome to Dashboard',
    description: 'This is your main dashboard where you can see all your event statistics at a glance.',
    position: 'bottom',
    delay: 800,
  },
  {
    id: 2,
    route: '/',
    selector: '[data-guide="create-event"]',
    title: 'Create New Event',
    description: 'Click here to create a new event for your clients.',
    position: 'bottom',
    delay: 300,
  },
  {
    id: 3,
    route: '/create',
    selector: 'input[name="clientName"]',
    title: 'Client Name',
    description: 'Enter your client\'s name here to start creating an event.',
    position: 'right',
    delay: 500,
  },
  {
    id: 4,
    route: '/create',
    selector: 'select[name="category"]',
    title: 'Event Category',
    description: 'Select the type of event you want to create from the dropdown.',
    position: 'right',
    delay: 300,
  },
  {
    id: 5,
    route: '/create',
    selector: 'input[name="date"]',
    title: 'Event Date',
    description: 'Choose the date for your event.',
    position: 'right',
    delay: 300,
  },
  {
    id: 6,
    route: '/create',
    selector: '[data-guide="submit-event"]',
    title: 'Save Event',
    description: 'Click this button to save your event and proceed.',
    position: 'top',
    delay: 300,
  },
  {
    id: 7,
    route: '/registry',
    selector: 'h2',
    title: 'Event Registry',
    description: 'This page shows all your created events. Click on any event to view details.',
    position: 'bottom',
    delay: 500,
  },
  {
    id: 8,
    route: '/registry',
    selector: 'table button',
    title: 'View Event Details',
    description: 'Click on any event row to view and manage its logistics.',
    position: 'right',
    delay: 300,
  },
];

const SmartGuide = ({
  steps = SAMPLE_STEPS,
  autoStart = true,
  showFloatingButton = true,
  onComplete,
  onSkip,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  
  const retryCountRef = useRef(0);
  const maxRetries = 15;
  const isFirstRenderRef = useRef(true);

  const currentStep = steps[currentStepIndex];

  const findElement = useCallback((selector) => {
    try {
      if (selector.startsWith('button:has-text')) {
        const text = selector.match(/button:has-text\("([^"]+)"\)/)?.[1];
        if (!text) return null;
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.toLowerCase().includes(text.toLowerCase())) {
            return btn;
          }
        }
        return null;
      }
      if (selector.startsWith('select[name=')) {
        const name = selector.match(/select\[name="([^"]+)"\]/)?.[1];
        if (!name) return null;
        return document.querySelector(`select[name="${name}"]`);
      }
      if (selector.startsWith('input[name=')) {
        const name = selector.match(/input\[name="([^"]+)"\]/)?.[1];
        if (!name) return null;
        return document.querySelector(`input[name="${name}"]`);
      }
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }, []);

  const getElementPosition = useCallback((element) => {
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const calculateTooltipPosition = useCallback((elementPos) => {
    const tooltipWidth = 300;
    const tooltipHeight = 160;
    const padding = 20;
    const gap = 14;
    
    let top = elementPos.top;
    let left = elementPos.left;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    switch (currentStep?.position) {
      case 'top':
        top = elementPos.top - tooltipHeight - gap;
        break;
      case 'bottom':
        top = elementPos.top + elementPos.height + gap;
        break;
      case 'left':
        left = elementPos.left - tooltipWidth - gap;
        top = elementPos.top + (elementPos.height - tooltipHeight) / 2;
        break;
      case 'right':
        left = elementPos.left + elementPos.width + gap;
        top = elementPos.top + (elementPos.height - tooltipHeight) / 2;
        break;
      default:
        top = elementPos.top + elementPos.height + gap;
    }
    
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    
    if (top < padding + window.scrollY) {
      top = elementPos.top + elementPos.height + gap;
    } else if (top + tooltipHeight > viewportHeight + window.scrollY - padding) {
      top = elementPos.top - tooltipHeight - gap;
    }
    
    return { top, left };
  }, [currentStep]);

  const executeStep = useCallback(async () => {
    if (!currentStep || !isRunning) return;
    
    const targetRoute = currentStep.route;
    const currentPath = location.pathname;
    
    if (targetRoute !== currentPath) {
      setIsNavigating(true);
      setSpotlightStyle({});
      navigate(targetRoute);
      return;
    }
    
    setIsNavigating(false);
    
    const delay = currentStep.delay || 300;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    let element = findElement(currentStep.selector);
    
    if (!element && retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      await new Promise(resolve => setTimeout(resolve, 150));
      executeStep();
      return;
    }
    
    retryCountRef.current = 0;
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (currentStep.action && typeof currentStep.action === 'function') {
        currentStep.action();
      }
      
      const elementPos = getElementPosition(element);
      const tooltipPos = calculateTooltipPosition(elementPos);
      
      setSpotlightStyle({
        top: elementPos.top,
        left: elementPos.left,
        width: elementPos.width,
        height: elementPos.height,
        borderRadius: '8px',
      });
      
      setTooltipPosition(tooltipPos);
      
      setCursorPos({
        top: elementPos.top + elementPos.height / 2,
        left: elementPos.left + elementPos.width / 2,
      });
      
      setShowCursor(true);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setShowCursor(false);
      }, 400);
    }
  }, [currentStep, isRunning, location.pathname, navigate, findElement, getElementPosition, calculateTooltipPosition]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    if (isRunning && currentStep) {
      if (isNavigating && location.pathname === currentStep.route) {
        setTimeout(() => {
          executeStep();
        }, 300);
      } else if (!isNavigating) {
        executeStep();
      }
    }
  }, [isRunning, currentStepIndex, location.pathname]);

  useEffect(() => {
    if (!isRunning) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, currentStepIndex]);

  useEffect(() => {
    if (autoStart && !isRunning && !isFirstRenderRef.current) {
      const timer = setTimeout(() => {
        setIsRunning(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      retryCountRef.current = 0;
      setSpotlightStyle({});
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      retryCountRef.current = 0;
      setSpotlightStyle({});
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setSpotlightStyle({});
    onComplete?.();
  };

  const handleSkip = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setSpotlightStyle({});
    onSkip?.();
  };

  const handleStart = () => {
    setCurrentStepIndex(0);
    setIsRunning(true);
    retryCountRef.current = 0;
  };

  if (!isRunning || !currentStep) {
    if (showFloatingButton && !isRunning) {
      return (
        <button
          onClick={handleStart}
          className="smart-guide-floating-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l2 2"/>
          </svg>
          Start Tour
        </button>
      );
    }
    return null;
  }

  return (
    <>
      <style>{`
        .smart-guide-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9997;
          pointer-events: none;
        }
        .smart-guide-spotlight {
          position: absolute;
          background: transparent;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
          transition: all 0.35s ease;
        }
        .smart-guide-tooltip {
          position: fixed;
          width: 300px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.25);
          padding: 18px;
          z-index: 9999;
          transition: all 0.3s ease;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .smart-guide-tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .smart-guide-step-count {
          font-size: 12px;
          color: #888;
          font-weight: 500;
        }
        .smart-guide-close {
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #999;
          padding: 0;
          line-height: 1;
        }
        .smart-guide-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .smart-guide-description {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .smart-guide-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .smart-guide-prev {
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          background: #fff;
          color: #444;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        .smart-guide-next {
          padding: 8px 18px;
          border-radius: 6px;
          border: none;
          background: #6366f1;
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        .smart-guide-cursor {
          position: fixed;
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.3);
          z-index: 10000;
          pointer-events: none;
          transition: all 0.25s ease;
        }
        .smart-guide-floating-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 20px;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .smart-guide-floating-btn:hover {
          background: #5558e3;
          transform: translateY(-1px);
        }
      `}</style>
      
      <div className="smart-guide-overlay">
        {spotlightStyle.top > 0 && (
          <div className="smart-guide-spotlight" style={spotlightStyle} />
        )}
      </div>

      {spotlightStyle.top > 0 && (
        <div
          className="smart-guide-tooltip"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
          }}
        >
          <div className="smart-guide-tooltip-header">
            <span className="smart-guide-step-count">
              {currentStepIndex + 1} / {steps.length}
            </span>
            <button onClick={handleSkip} className="smart-guide-close">
              ×
            </button>
          </div>
          
          <h3 className="smart-guide-title">{currentStep.title}</h3>
          <p className="smart-guide-description">{currentStep.description}</p>
          
          <div className="smart-guide-footer">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="smart-guide-prev"
              style={{ opacity: currentStepIndex === 0 ? 0.5 : 1 }}
            >
              ← Prev
            </button>
            <button onClick={handleNext} className="smart-guide-next">
              {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {showCursor && (
        <div
          className="smart-guide-cursor"
          style={{
            top: cursorPos.top - 4,
            left: cursorPos.left - 4,
            opacity: isAnimating ? 1 : 0,
          }}
        />
      )}
    </>
  );
};

export default SmartGuide;