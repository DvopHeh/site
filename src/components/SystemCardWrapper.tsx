// src/components/SystemCardWrapper.tsx

import React, { useState } from 'react';
import SystemCard from './SystemCard';
import { SystemDetails } from '../data/systemSpecs';

// Define the props for this new wrapper
interface SystemCardWrapperProps {
  allSystemSpecs: SystemDetails[];
}

const SystemCardWrapper: React.FC<SystemCardWrapperProps> = ({ allSystemSpecs }) => {
  // State to track the ID of the currently expanded card.
  // Null means no card is expanded.
  const [currentlyExpandedId, setCurrentlyExpandedId] = useState<string | null>(null);

  const handleCardToggle = (idToToggle: string) => {
    setCurrentlyExpandedId(prevId => {
      // If the clicked card is already open, close it (set to null).
      if (prevId === idToToggle) {
        return null;
      }
      // Otherwise, open the clicked card (set its ID).
      return idToToggle;
    });
  };

  return (
    <div className="system-cards-container">
      {allSystemSpecs.map((system) => {
        // Create the unique ID for the SystemCard component
        // Use the same logic as inside SystemCard.tsx
        const systemId = system.name.replace(/\s/g, "-");
        
        return (
          <SystemCard
            key={systemId} // Use the unique ID as the key
            system={system}
            // Check if this card's ID matches the one in state
            isExpanded={currentlyExpandedId === systemId}
            // Pass the state setter function
            onToggle={handleCardToggle}
          />
        );
      })}
    </div>
  );
};

export default SystemCardWrapper;