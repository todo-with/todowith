import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { UserProfile } from '@/types/user';

// User Profile
export const useUserProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data } = await api.get<UserProfile>('/user/profile');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// My Matchings
export const useMyMatchings = () => {
  return useQuery({
    queryKey: ['myMatchings'],
    queryFn: async () => {
      const { data } = await api.get('/matching/my');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// My Skills (Profile Skills)
export const useAllSkills = () => {
  return useQuery({
    queryKey: ['allSkills'],
    queryFn: async () => {
      const { data } = await api.get('/skill/all');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// My Tasks (TODOs)
export const useMyTasks = () => {
  return useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const { data } = await api.get('/todo/my-tasks');
      return data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useOpponentTasks = (matchingId: string | null) => {
  return useQuery({
    queryKey: ['opponentTasks', matchingId],
    queryFn: async () => {
      if (!matchingId) return null;
      const { data } = await api.get(`/todo/${matchingId}/opponent-tasks`);
      return data;
    },
    enabled: !!matchingId,
    staleTime: 1 * 60 * 1000,
  });
};

// Announcements
export const useAnnouncements = (keyword?: string) => {
  return useQuery({
    queryKey: ['announcements', keyword],
    queryFn: async () => {
      const { data } = await api.get('/announcement/all', {
        params: { keyword: keyword || undefined }
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Chat Rooms
export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const { data } = await api.get('/chat/rooms');
      return data;
    },
    staleTime: 1 * 60 * 1000,
    // Polling could be enabled here if we want pseudo real-time, but websockets are better
    // refetchInterval: 5000, 
  });
};

// Chat History
export const useChatHistory = (roomId: string | null) => {
  return useQuery({
    queryKey: ['chatHistory', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data } = await api.get(`/chat/room/${roomId}`);
      return data;
    },
    enabled: !!roomId,
    staleTime: 0,
    gcTime: 0,
  });
};

// Available Skills
export const useAvailableSkills = (keyword?: string) => {
  return useQuery({
    queryKey: ['availableSkills', keyword],
    queryFn: async () => {
      const { data } = await api.get('/skill/all_available', {
        params: { keyword: keyword || undefined }
      });
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
};
