// src/components/SystemCard.tsx
import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
// Import all relevant interfaces from systemSpecs.ts
import { SystemDetails, MonitorDetail } from "../data/systemSpecs.ts";

interface SystemCardProps extends React.JSX.IntrinsicAttributes {
  system: SystemDetails;
  // New Props for controlled state
  isExpanded: boolean; // Tells the card if it should be open
  onToggle: (systemId: string) => void; // Function to call when header is clicked
}

interface ListItem {
  label: string;
  value: string | MonitorDetail[];
  notes?: string;
  link?: string;
}

const ItemList: React.FC<{ items: ListItem[] }> = ({ items }) => (
  // ... (ItemList component remains unchanged)
  <div className="item-list">
    {items.map((item, index) => (
      <div
        key={`${item.label}-${index}`}
        className="item-list__item"
      >
        <span className="item-list__label">
          {item.label}:
        </span>
        <span className="item-list__value">
          {Array.isArray(item.value) ? (
            <ul className="monitor-list">
              {item.value.map((monitor, i) => (
                <li key={i}>
                  {monitor.model}
                  {monitor.role && ` (${monitor.role})`}
                  {monitor.size && `, ${monitor.size}`}
                  {monitor.refreshRate && `, ${monitor.refreshRate}`}
                  {monitor.notes && (
                    <span className="monitor-list__note">
                      ({monitor.notes})
                    </span>
                  )}
                  {monitor.link && typeof monitor.link === "string" && (
                    <a
                      href={monitor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="monitor-list__link"
                    >
                      [Link]
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            item.value
          )}
          {item.notes && typeof item.value === "string" && (
            <span className="item-list__note">
              ({item.notes})
            </span>
          )}
          {item.link && typeof item.value === "string" && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="item-list__link"
            >
              [Link]
            </a>
          )}
        </span>
      </div>
    ))}
  </div>
);


const SystemCard: React.FC<SystemCardProps> = ({ system, isExpanded, onToggle }) => {
  // We need a unique ID for this system to pass back to the parent
  const systemId = system.name.replace(/\s/g, "-");
  
  // Call the onToggle function from props, passing this card's ID
  const handleCardToggle = () => {
    onToggle(systemId);
  };

  const contentId = `system-specs-content-${systemId}`;
  const expandedClass = isExpanded ? "system-card__content--expanded" : "system-card__content--collapsed";

  return (
    <section className="system-card">
      <button
        type="button"
        // Use the new handler which calls the parent's function
        onClick={handleCardToggle}
        className="system-card__header-btn"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <h3 className="system-card__title">{system.name}</h3>
        <span className="system-card__toggle-icon">
          {isExpanded ? (
            <FaChevronUp size="1em" />
          ) : (
            <FaChevronDown size="1em" />
          )}
        </span>
      </button>

      {system.description && (
        <p className="system-card__description">{system.description}</p>
      )}

      <div
        id={contentId}
        className={`system-card__content ${expandedClass}`}
      >
        <div className="system-card__inner-content">
          {/* Core PC Specifications Section */}
          { system.specs && system.specs.length > 0 && (
            <>
              <h4 className="system-card__section-header">
                Core PC Specifications
              </h4>
              <ItemList items={system.specs} />
            </>
          )}

          { system.accessories && system.accessories.length > 0 && (
            <>
              <h4 className="system-card__section-header">
                Accessories
              </h4>
              <ItemList items={system.accessories} />
            </>
          )}
          
          {/* Peripherals Section (conditionally rendered) */}
          {system.peripherals && system.peripherals.length > 0 && (
            <>
              <h4 className="system-card__section-header peripheral-section">
                Peripherals
              </h4>
              <ItemList items={system.peripherals} />
            </>
          )}
          
          {/* Software & Operating Systems Section (conditionally rendered) */}
          {system.softwareAndOS && system.softwareAndOS.length > 0 && (
            <>
              <h4 className="system-card__section-header peripheral-section">
                Software & Operating Systems
              </h4>
              <ItemList items={system.softwareAndOS} />
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SystemCard;