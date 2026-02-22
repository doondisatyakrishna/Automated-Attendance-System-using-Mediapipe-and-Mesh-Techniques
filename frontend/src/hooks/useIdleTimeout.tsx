import { useEffect, useRef } from 'react';

interface IdleTimeoutProps {
  onIdle: () => void;
  idleTime: number; // in minutes
}

export const useIdleTimeout = ({ onIdle, idleTime }: IdleTimeoutProps) => {
  const timeoutId = useRef<number | null>(null);
  const idleTimeout = idleTime * 60 * 1000; // convert minutes to milliseconds

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(onIdle, idleTimeout);
  };

  const handleEvent = () => {
    resetTimer();
  };

  useEffect(() => {
    // List of events that indicate user activity
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

    // Set up the initial timer and event listeners
    resetTimer();
    events.forEach(event => window.addEventListener(event, handleEvent));

    // Cleanup function: remove event listeners and clear timeout
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [onIdle, idleTime]); // Rerun effect if props change

  return null; // This hook does not render anything
};