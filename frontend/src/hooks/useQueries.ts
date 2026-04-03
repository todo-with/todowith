import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// User Mutations
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; description?: string }) => {
      const { data } = await api.patch('/user/me', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
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

export const useMatchingDetail = (matchingId: string | null) => {
  return useQuery({
    queryKey: ['matchingDetail', matchingId],
    queryFn: async () => {
      if (!matchingId) return null;
      const { data } = await api.get(`/matching/${matchingId}`);
      return data;
    },
    enabled: !!matchingId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateMatching = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchingId, payload }: { matchingId: string; payload: { name?: string; status?: string } }) => {
      const { data } = await api.patch(`/matching/${matchingId}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchingDetail', variables.matchingId] });
      queryClient.invalidateQueries({ queryKey: ['myMatchings'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
};

export const useMatchingRequests = () => {
  return useQuery({
    queryKey: ['matchingRequests'],
    queryFn: async () => {
      const { data } = await api.get('/matching/requests');
      return data;
    },
    staleTime: 1 * 60 * 1000,
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

export const useGeneratedTodos = (chatroomId: string | null) => {
  return useQuery({
    queryKey: ['generatedTodos', chatroomId],
    queryFn: async () => {
      if (!chatroomId) return null;
      const { data } = await api.get('/todo/generated_todo', { params: { chatroom_id: chatroomId } });
      return data;
    },
    enabled: !!chatroomId,
    staleTime: 0,
  });
};

// Todo Mutations
export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTodo: { matching_id: string; user_id: string; name: string; skill: string }) => {
      const { data } = await api.post('/todo', newTodo);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['opponentTasks', variables.matching_id] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { data } = await api.patch(`/todo/${taskId}`, { is_completed: isCompleted });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      // To invalidate opponent tasks properly we'd need matching_id, but we can just invalidate all or depend on specific refetches
      queryClient.invalidateQueries({ queryKey: ['opponentTasks'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.delete(`/todo/${taskId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['opponentTasks'] });
    },
  });
};

export const useCreateGeneratedTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data } = await api.post('/todo/generated_todo', { room_id: roomId });
      return data;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['generatedTodos', roomId] });
    },
  });
};

export const useDeleteGeneratedTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, roomId }: { candidateId: string; roomId: string }) => {
      const { data } = await api.delete(`/todo/generated_todo/${candidateId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generatedTodos', variables.roomId] });
    },
  });
};

export const useSelectCandidateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, roomId, targetUserId }: { targetId: string; roomId: string; targetUserId?: string }) => {
      const { data } = await api.post(`/todo/${targetId}/select`, { user_id: targetUserId });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['opponentTasks'] });
      queryClient.invalidateQueries({ queryKey: ['generatedTodos', variables.roomId] });
    },
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

export const useMyAnnouncements = () => {
  return useQuery({
    queryKey: ['myAnnouncements'],
    queryFn: async () => {
      const { data } = await api.get('/announcement/my');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnnouncementDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['announcementDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/announcement/detail/${id}`);
      return data;
    },
    enabled: !!id,
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
