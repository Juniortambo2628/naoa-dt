import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  guestService, settingService, galleryService, contentService,
  giftService, guestbookService, faqService, enquiryService,
  songRequestService, scheduleService, tableService,
  notificationService, analyticsService, checkinService,
  polaroidService, weatherService,
} from '../services/api';
import usePolling from './usePolling';

// --- Guests ---
export const useGuests = (params = {}) => {
  return useQuery({
    queryKey: ['guests', params],
    queryFn: async () => {
      const { data } = await guestService.getAll(params);
      return data.data || data;
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
    onSuccess: (response) => {
      if (response.data && response.data.settings) {
        queryClient.setQueryData(['settings'], response.data.settings);
      }
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
    },
  });
};

// --- Content ---
export const useContent = () => {
  return useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const { data } = await contentService.getAll();
      return data;
    },
  });
};

// --- Gifts ---
export const useGifts = () => {
  return useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const { data } = await giftService.getAll();
      return data;
    },
  });
};

export const useGiftStats = () => {
  return useQuery({
    queryKey: ['giftStats'],
    queryFn: async () => {
      const { data } = await giftService.getStats();
      return data;
    },
  });
};

// --- Guestbook ---
export const useGuestbook = () => {
  return useQuery({
    queryKey: ['guestbook'],
    queryFn: async () => {
      const { data } = await guestbookService.getAll();
      return data;
    },
  });
};

// --- FAQs ---
export const useFAQs = () => {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data } = await faqService.getAll();
      return data;
    },
  });
};

// --- Enquiries ---
export const useEnquiries = (params = {}) => {
  return useQuery({
    queryKey: ['enquiries', params],
    queryFn: async () => {
      const { data } = await enquiryService.getAll(params);
      return data;
    },
  });
};

// --- Song Requests ---
export const useSongRequests = () => {
  return useQuery({
    queryKey: ['songRequests'],
    queryFn: async () => {
      const { data } = await songRequestService.getAll();
      return data;
    },
  });
};

// --- Schedule ---
export const useSchedule = () => {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const { data } = await scheduleService.getSchedule();
      return data;
    },
  });
};

// --- Tables ---
export const useTables = () => {
  return useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await tableService.getAll();
      return data;
    },
  });
};

// --- Notifications ---
export const useNotifications = () => {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await notificationService.getRecent();
      return data;
    },
  });

  usePolling(query.refetch, 30000);

  return query;
};

// --- Analytics ---
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await analyticsService.getStats();
      return data;
    },
  });
};

// --- Check-in Stats ---
export const useCheckinStats = () => {
  return useQuery({
    queryKey: ['checkinStats'],
    queryFn: async () => {
      const { data } = await checkinService.getStats();
      return data;
    },
  });
};

// --- Polaroid Feed ---
export const usePolaroidFeed = () => {
  const query = useQuery({
    queryKey: ['polaroidFeed'],
    queryFn: async () => {
      const { data } = await polaroidService.getAll();
      return data;
    },
  });

  usePolling(query.refetch, 15000);

  return query;
};

// --- Weather ---
export const useWeather = () => {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const { data } = await weatherService.getForecast();
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
};

// --- Generic CRUD mutation helper ---
export const useCrudMutation = (service, queryKey) => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data) => service.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }) => service.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: (id) => service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { create, update, remove };
};
