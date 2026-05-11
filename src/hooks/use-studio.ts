import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studioApi } from "@/lib/studio-api";
import { Studio, StudioMember, StudioProject, StudioAsset } from "@/types/studio";

// Hook to fetch a studio
export function useStudio(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studio", studioId],
    queryFn: () => (studioId ? studioApi.getStudio(studioId) : null),
    enabled: !!studioId,
  });
}

// Hook to fetch user's studio
export function useUserStudio(userId: string | undefined) {
  return useQuery({
    queryKey: ["userStudio", userId],
    queryFn: () => (userId ? studioApi.getUserStudio(userId) : null),
    enabled: !!userId,
  });
}

// Hook to fetch studio members
export function useStudioMembers(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studioMembers", studioId],
    queryFn: () => (studioId ? studioApi.getStudioMembers(studioId) : []),
    enabled: !!studioId,
  });
}

// Hook to fetch studio projects
export function useStudioProjects(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studioProjects", studioId],
    queryFn: () => (studioId ? studioApi.getStudioProjects(studioId) : []),
    enabled: !!studioId,
  });
}

// Hook to fetch studio assets
export function useStudioAssets(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studioAssets", studioId],
    queryFn: () => (studioId ? studioApi.getStudioAssets(studioId) : []),
    enabled: !!studioId,
  });
}

// Hook to fetch studio activity
export function useStudioActivity(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studioActivity", studioId],
    queryFn: () => (studioId ? studioApi.getStudioActivity(studioId) : []),
    enabled: !!studioId,
  });
}

// Hook to fetch studio analytics
export function useStudioAnalytics(studioId: string | undefined) {
  return useQuery({
    queryKey: ["studioAnalytics", studioId],
    queryFn: () => (studioId ? studioApi.getStudioAnalytics(studioId) : []),
    enabled: !!studioId,
  });
}

// Hook to create a studio
export function useCreateStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studio: Partial<Studio>) => studioApi.createStudio(studio),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["studio"] });
      }
    },
  });
}

// Hook to update a studio
export function useUpdateStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studioId, updates }: { studioId: string; updates: Partial<Studio> }) =>
      studioApi.updateStudio(studioId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studio", variables.studioId] });
    },
  });
}

// Hook to create a project
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<StudioProject>) => studioApi.createProject(project),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["studioProjects"] });
      }
    },
  });
}

// Hook to update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Partial<StudioProject> }) =>
      studioApi.updateProject(projectId, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["studioProjects"] });
      }
    },
  });
}

// Hook to add a studio member
export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studioId,
      userId,
      role,
    }: {
      studioId: string;
      userId: string;
      role: string;
    }) => studioApi.addStudioMember(studioId, userId, role),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["studioMembers"] });
      }
    },
  });
}

// Hook to remove a studio member
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => studioApi.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studioMembers"] });
    },
  });
}

// Hook to update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      studioApi.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studioMembers"] });
    },
  });
}

// Hook to upload an asset
export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: Partial<StudioAsset>) => studioApi.uploadAsset(asset),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["studioAssets"] });
      }
    },
  });
}
