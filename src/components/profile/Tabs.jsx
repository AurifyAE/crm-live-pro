// src/components/Tabs.jsx
import React from 'react';

export const Tabs = ({ children, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {React.Children.map(children, (child) => {
          return React.cloneElement(child, {
            isActive: activeTab === child.props.id,
            onClick: () => onChange(child.props.id),
          });
        })}
      </nav>
    </div>
  );
};

export const Tab = ({ id, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
};