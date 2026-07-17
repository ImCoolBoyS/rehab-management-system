import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Site, User, Student, Assessment, TrainingRecord, HomeVisit, Announcement } from '../types';

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('rehab_auth_token', token);
  } else {
    localStorage.removeItem('rehab_auth_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('rehab_auth_token');
  }
  return authToken;
};


const handleMutationError = (error: any) => {
  if (error?.response?.data?.detail) {
    alert("操作失败: " + error.response.data.detail);
  } else if (error?.message) {
    alert("操作失败: " + error.message);
  } else {
    alert("操作失败，请检查网络或联系管理员");
  }
  console.error("Mutation error:", error);
};
const client = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor - adds JWT token to all requests
client.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Auth interceptor - handle 401 responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - clear it
      setAuthToken(null);
      // The App.tsx will check this and redirect to login
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// ==================== 1. SITES ====================
export const useSitesQuery = () => {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await client.get('/api/v1/sites');
      return response.data;
    },
  });
};

// ==================== 2. USERS ====================
export const useUsersQuery = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await client.get('/api/v1/users');
      return response.data;
    },
  });
};

export const useAddUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUser: Partial<User>) => {
      const response = await client.post('/api/v1/users', newUser);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedUser: User) => {
      const response = await client.put(`/api/v1/users/${updatedUser.id}`, updatedUser);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await client.delete(`/api/v1/users/${userId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ==================== 3. STUDENTS ====================
export const useStudentsQuery = () => {
  return useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await client.get('/api/v1/students');
      return response.data;
    },
  });
};

export const useAddStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newStudent: Partial<Student>) => {
      const response = await client.post('/api/v1/students', newStudent);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedStudent: Student) => {
      const response = await client.put(`/api/v1/students/${updatedStudent.id}`, updatedStudent);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await client.delete(`/api/v1/students/${studentId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// ==================== 4. ASSESSMENTS ====================
export const useAssessmentsQuery = () => {
  return useQuery<Assessment[]>({
    queryKey: ['assessments'],
    queryFn: async () => {
      const response = await client.get('/api/v1/assessments');
      return response.data;
    },
  });
};

export const useAddAssessmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAssessment: Partial<Assessment>) => {
      const response = await client.post('/api/v1/assessments', newAssessment);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

export const useDeleteAssessmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await client.delete(`/api/v1/assessments/${assessmentId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

// ==================== 5. TRAININGS ====================
export const useTrainingsQuery = () => {
  return useQuery<TrainingRecord[]>({
    queryKey: ['trainings'],
    queryFn: async () => {
      const response = await client.get('/api/v1/trainings');
      return response.data;
    },
  });
};

export const useAddTrainingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTraining: Partial<TrainingRecord>) => {
      const response = await client.post('/api/v1/trainings', newTraining);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

export const useDeleteTrainingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainingId: string) => {
      const response = await client.delete(`/api/v1/trainings/${trainingId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

// ==================== 6. VISITS ====================
export const useVisitsQuery = () => {
  return useQuery<HomeVisit[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const response = await client.get('/api/v1/visits');
      return response.data;
    },
  });
};

export const useAddVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newVisit: Partial<HomeVisit>) => {
      const response = await client.post('/api/v1/visits', newVisit);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};

export const useDeleteVisitMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visitId: string) => {
      const response = await client.delete(`/api/v1/visits/${visitId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};

// ==================== 7. ANNOUNCEMENTS ====================
export const useAnnouncementsQuery = () => {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await client.get('/api/v1/announcements');
      return response.data;
    },
  });
};

export const useAddAnnouncementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAnnouncement: Partial<Announcement>) => {
      const response = await client.post('/api/v1/announcements', newAnnouncement);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useUpdateAnnouncementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedAnnouncement: Announcement) => {
      const response = await client.put(`/api/v1/announcements/${updatedAnnouncement.id}`, updatedAnnouncement);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useDeleteAnnouncementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const response = await client.delete(`/api/v1/announcements/${announcementId}`);
      return response.data;
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

// ==================== 8. LOGIN ====================
export const loginUser = async (username: string, password: string): Promise<{success: boolean; token: string; user: User}> => {
  const response = await client.post('/api/v1/login', { username, password });
  const data = response.data;
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};
// ==================== 9. FILE UPLOAD ====================
export const uploadPdf = async (file: File): Promise<{success: boolean; filepath: string; filename: string; size: string}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/api/v1/upload/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getPdfUrl = (filepath: string): string => {
  if (!filepath) return '';
  // filepath is like: C:/Users/.../uploads/pdfs/xxx.pdf
  // We need to extract the relative path for the API
  const parts = filepath.split('\\').join('/').split('uploads/');
  if (parts.length > 1) {
    return '/api/v1/files/uploads/' + parts[1];
  }
  return '/api/v1/files/' + filepath;
};
