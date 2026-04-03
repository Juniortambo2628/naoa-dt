import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService, settingService, galleryService, contentService } from '../services/api';

// --- Guests ---
export const useGuests = (params = {}) => {
  return useQuery({
    queryKey: ['guests', params],
    queryFn: async () => {
      const { data } = await guestService.getAll(params);
      return data.data || data; // Handle pagination or direct array
    },
  });
};

export const useGuestByCode = (code) => {
  return useQuery({
    queryKey: ['guest', code],
    queryFn: async () => {
      const { data } = await guestService.getByCode(code);
      return data;
    },
    enabled: !!code,
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGuest) => guestService.create(newGuest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useUpdateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => guestService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useDeleteGuest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => guestService.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['guests'] });
      },
    });
};

// --- Settings ---
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await settingService.getAll();
      return data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settingsData) => settingService.update(settingsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

// --- Gallery ---
export const useGallery = () => {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data } = await galleryService.getAll();
      return data;
    },
  });
};

export const useToggleGalleryVisibility = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id, isVisible) => galleryService.update(id, { is_visible: isVisible }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
        }
    });
};

// --- Content ---
export const useContent = () => {
    return useQuery({
        queryKey: ['content'],
        queryFn: async () => {
            const { data } = await contentService.getAll();
            return data;
        }
    });
};
