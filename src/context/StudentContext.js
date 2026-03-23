import React, { createContext, useState, useContext, useCallback } from 'react';
import { databaseService } from '../services/databaseService';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [activeStudent, setActiveStudent] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const selectStudent = useCallback((student) => {
    setActiveStudent(student);
  }, []);

  const clearStudent = useCallback(() => {
    setActiveStudent(null);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const updateStudentName = useCallback(async (studentId, newName) => {
    try {
      // Fetch the latest student data to ensure we have the correct partition key / full object
      const all = await databaseService.getAllStudents();
      const student = all.find(s => s.id === studentId);
      if (!student) throw new Error("Student not found");

      const updatedStudent = { ...student, studentName: newName };
      await databaseService.upsertStudent(updatedStudent);
      
      // Update active student if it's the one we just edited
      if (activeStudent?.id === studentId) {
        setActiveStudent(updatedStudent);
      }

      // Trigger a global refresh for all components listening to this context
      triggerRefresh();
      return updatedStudent;
    } catch (err) {
      console.error("Failed to update student name:", err);
      throw err;
    }
  }, [activeStudent, triggerRefresh]);

  return (
    <StudentContext.Provider value={{ 
      activeStudent, 
      selectStudent, 
      clearStudent, 
      refreshTrigger, 
      triggerRefresh,
      updateStudentName 
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);