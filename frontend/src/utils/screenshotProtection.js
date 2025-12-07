// Screenshot Prevention Utilities

export const initScreenshotProtection = (onAttempt) => {
  const listeners = [];

  // Disable right-click context menu
  const disableRightClick = (e) => {
    e.preventDefault();
    onAttempt?.();
    return false;
  };

  // Detect screenshot keyboard shortcuts
  const detectScreenshotKeys = (e) => {
    // PrintScreen key
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      onAttempt?.();
      return false;
    }

    // Windows Snipping Tool (Win + Shift + S)
    if (e.key === 's' && e.shiftKey && e.metaKey) {
      e.preventDefault();
      onAttempt?.();
      return false;
    }

    // Mac Screenshot (Cmd + Shift + 3/4/5)
    if ((e.key === '3' || e.key === '4' || e.key === '5') && e.shiftKey && e.metaKey) {
      e.preventDefault();
      onAttempt?.();
      return false;
    }

    // Windows Game Bar (Win + G)
    if (e.key === 'g' && e.metaKey) {
      e.preventDefault();
      onAttempt?.();
      return false;
    }

    // Disable F12 DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I (DevTools)
    if (e.key === 'I' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      return false;
    }
  };

  // Detect when window loses focus (possible screenshot)
  const detectBlur = () => {
    onAttempt?.();
  };

  // Detect visibility change (screen recording or screenshot tools)
  const detectVisibilityChange = () => {
    if (document.hidden) {
      setTimeout(() => {
        if (!document.hidden) {
          onAttempt?.();
        }
      }, 100);
    }
  };

  // Add all listeners
  document.addEventListener('contextmenu', disableRightClick);
  document.addEventListener('keydown', detectScreenshotKeys);
  document.addEventListener('keyup', detectScreenshotKeys);
  window.addEventListener('blur', detectBlur);
  document.addEventListener('visibilitychange', detectVisibilityChange);

  listeners.push(
    { type: 'contextmenu', handler: disableRightClick },
    { type: 'keydown', handler: detectScreenshotKeys },
    { type: 'keyup', handler: detectScreenshotKeys },
    { type: 'blur', handler: detectBlur, target: window },
    { type: 'visibilitychange', handler: detectVisibilityChange }
  );

  // Cleanup function
  return () => {
    listeners.forEach(({ type, handler, target }) => {
      (target || document).removeEventListener(type, handler);
    });
  };
};

// Add watermark to prevent useful screenshots
export const addWatermark = (username) => {
  const watermark = document.createElement('div');
  watermark.id = 'screenshot-watermark';
  watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
    opacity: 0.1;
    font-size: 48px;
    font-weight: bold;
    color: #000;
    transform: rotate(-45deg);
    display: flex;
    flex-wrap: wrap;
    align-content: space-around;
    justify-content: space-around;
  `;
  
  // Add multiple watermark instances
  for (let i = 0; i < 20; i++) {
    const text = document.createElement('div');
    text.textContent = `${username} • SnapVibe`;
    text.style.cssText = 'padding: 20px;';
    watermark.appendChild(text);
  }
  
  document.body.appendChild(watermark);
  
  return () => {
    const element = document.getElementById('screenshot-watermark');
    if (element) element.remove();
  };
};
