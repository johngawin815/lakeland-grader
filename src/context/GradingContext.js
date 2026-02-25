import React, { createContext, useState, useContext } from 'react';

const GradingContext = createContext();

export const GradingProvider = ({ children }) => {
  const [gradeCardPayload, setGradeCardPayload] = useState(null);
  const [commentTone, setCommentTone] = useState('balanced');

  const clearGradeCardPayload = () => {
    setGradeCardPayload(null);
  };

  return (
    <GradingContext.Provider value={{ gradeCardPayload, setGradeCardPayload, clearGradeCardPayload, commentTone, setCommentTone }}>
      {children}
    </GradingContext.Provider>
  );
};

export const useGrading = () => useContext(GradingContext);
