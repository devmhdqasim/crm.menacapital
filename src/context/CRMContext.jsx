import React, { createContext, useContext, useState } from 'react';

// Create the context
const CRMContext = createContext();

// Create a custom hook to use the CRM context
export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

// Create the provider component
export const CRMProvider = ({ children }) => {
  const [crmCategorySummary, setCrmCategorySummary] = useState({
    Assigned: 0,
    NotAssigned: 0,
    Contacted: 0,
    Interested: 0,
    Answered: 0,
    NotAnswered: 0,
    NotInterested: 0,
    Warm: 0,
    Hot: 0,
    Demo: 0,
    Real: 0,
    Deposit: 0,
    NotDeposit: 0,
  });

  const value = {
    crmCategorySummary,
    setCrmCategorySummary,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};