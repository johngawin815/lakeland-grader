import React, { createContext, useState, useContext } from 'react';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [activeStudent, setActiveStudent] = useState(null);

  const selectStudent = (student) => {
    setActiveStudent(student);
    console.log("🎓 Context Updated:", student?.studentName);
  };

  const clearStudent = () => {
    setActiveStudent(null);
  };

  return (
    <StudentContext.Provider value={{ activeStudent, selectStudent, clearStudent }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);