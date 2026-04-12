import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export function useApiQuery<T>(
  queryKey: string[],
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<ApiResponse<T>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ApiResponse<T>, AxiosError<ApiError>>({
    queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<T>>(url, config);
      return data;
    },
    staleTime: 30_000,
    retry: 2,
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string | ((vars: TVariables) => string),
  options?: {
    invalidateKeys?: string[][];
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: AxiosError<ApiError>) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, TVariables>({
    mutationFn: async (variables) => {
      const endpoint = typeof url === 'function' ? url(variables) : url;
      let response;
      if (method === 'delete') {
        response = await apiClient.delete<ApiResponse<TData>>(endpoint);
      } else {
        response = await apiClient[method]<ApiResponse<TData>>(endpoint, variables);
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || options?.errorMessage || 'An error occurred';
      toast.error(message);
      options?.onError?.(error);
    },
  });
}

export function useApiList<T>(
  queryKey: string[],
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Omit<UseQueryOptions<ApiResponse<T[]>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>,
) {
  const filteredParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    : undefined;

  return useQuery<ApiResponse<T[]>, AxiosError<ApiError>>({
    queryKey: [...queryKey, filteredParams],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<T[]>>(url, {
        params: filteredParams,
      });
      return data;
    },
    staleTime: 30_000,
    retry: 2,
    ...options,
  });
}

export function useFileUpload<TData = unknown>(
  url: string,
  options?: {
    invalidateKeys?: string[][];
    successMessage?: string;
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: AxiosError<ApiError>) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, FormData>({
    mutationFn: async (formData) => {
      const { data } = await apiClient.post<ApiResponse<TData>>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Upload failed');
      options?.onError?.(error);
    },
  });
}
