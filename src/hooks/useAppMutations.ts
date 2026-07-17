import { useCallback } from 'react';
import {
  useAddStudentMutation, useUpdateStudentMutation, useDeleteStudentMutation,
  useAddAssessmentMutation, useDeleteAssessmentMutation,
  useAddTrainingMutation, useDeleteTrainingMutation,
  useAddVisitMutation, useDeleteVisitMutation,
  useAddAnnouncementMutation, useUpdateAnnouncementMutation, useDeleteAnnouncementMutation,
} from '../lib/api';
import type { Student, Assessment, TrainingRecord, HomeVisit, Announcement, Site } from '../types';

export function useAppMutations(sites: Site[]) {
  const addStudent = useAddStudentMutation();
  const updateStudent = useUpdateStudentMutation();
  const deleteStudent = useDeleteStudentMutation();
  const addAssessment = useAddAssessmentMutation();
  const deleteAssessment = useDeleteAssessmentMutation();
  const addTraining = useAddTrainingMutation();
  const deleteTraining = useDeleteTrainingMutation();
  const addVisit = useAddVisitMutation();
  const deleteVisit = useDeleteVisitMutation();
  const addAnnouncement = useAddAnnouncementMutation();
  const updateAnnouncement = useUpdateAnnouncementMutation();
  const deleteAnnouncement = useDeleteAnnouncementMutation();

  const siteIdForTown = useCallback((town: string, fallbackId: string) => {
    const matched = sites.find(s => s.town === town);
    return matched ? matched.id : fallbackId;
  }, [sites]);

  return {
    addStudent: useCallback((s: Student) => addStudent.mutate({ ...s, siteId: siteIdForTown(s.town, s.siteId) }), [addStudent, siteIdForTown]),
    updateStudent: useCallback((s: Student) => updateStudent.mutate({ ...s, siteId: siteIdForTown(s.town, s.siteId) }), [updateStudent, siteIdForTown]),
    deleteStudent: useCallback((id: string) => deleteStudent.mutate(id), [deleteStudent]),
    addAssessment: useCallback((a: Assessment) => addAssessment.mutate(a), [addAssessment]),
    deleteAssessment: useCallback((id: string) => deleteAssessment.mutate(id), [deleteAssessment]),
    addTraining: useCallback((t: TrainingRecord) => addTraining.mutate(t), [addTraining]),
    deleteTraining: useCallback((id: string) => deleteTraining.mutate(id), [deleteTraining]),
    addVisit: useCallback((v: HomeVisit) => addVisit.mutate(v), [addVisit]),
    deleteVisit: useCallback((id: string) => deleteVisit.mutate(id), [deleteVisit]),
    addAnnouncement: useCallback((a: Announcement) => addAnnouncement.mutate(a), [addAnnouncement]),
    updateAnnouncement: useCallback((a: Announcement) => updateAnnouncement.mutate(a), [updateAnnouncement]),
    deleteAnnouncement: useCallback((id: string) => deleteAnnouncement.mutate(id), [deleteAnnouncement]),
  };
}
