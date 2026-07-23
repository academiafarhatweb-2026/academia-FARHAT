import { useState } from 'react';

export default function Tabs({ tabs, initialActive }) {
  const [active, setActive] = useState(initialActive || tabs[0].label);
  const current = tabs.find((t) => t.label === active) || tabs[0];

  return (
    <div>
      <div className="tabs no-print">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={tab.label === active ? 'active' : ''}
            onClick={() => setActive(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current.content}
    </div>
  );
}
