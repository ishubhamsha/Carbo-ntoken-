import React, { useEffect, useState } from 'react';

interface TypewriterProps {
  messages: string[];
  className?: string;
  typingSpeed?: number; // ms per character
  pauseTime?: number;   // ms to pause after message
  eraseSpeed?: number;  // ms per character when erasing
}

const Typewriter: React.FC<TypewriterProps> = ({
  messages,
  className = '',
  typingSpeed = 150000,
  pauseTime = 1,
  eraseSpeed = 300000,
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'erasing'>('typing');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const fullText = messages[currentMessage];

    if (phase === 'typing') {
      if (displayed.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayed(fullText.slice(0, displayed.length + 1));
        }, typingSpeed);
      } else {
        setPhase('pausing');
        timeout = setTimeout(() => {
          setPhase('erasing');
        }, pauseTime);
      }
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(fullText.slice(0, displayed.length - 1));
        }, eraseSpeed);
      } else {
        setPhase('typing');
        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }
    } else if (phase === 'pausing') {
      // Do nothing, handled by setTimeout above
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, messages, currentMessage, typingSpeed, pauseTime, eraseSpeed]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default Typewriter; 