import { create } from "zustand";
import { ClusterContext, ResourceSummary } from "../lib/tauri";

export type ResourceKind = "pods" | "deployments" | "services" | "configmaps" | "secrets" | "ingresses" | "pvcs" | "events";

interface AppState {
  contexts: ClusterContext[];
  activeContext: string | null;
  namespaces: string[];
  activeNamespace: string;
  activeKind: ResourceKind;
  resources: ResourceSummary[];
  isLoading: boolean;
  error: string | null;
  selectedResource: ResourceSummary | null;
  detailTab: "yaml" | "logs" | "events";

  setContexts: (contexts: ClusterContext[]) => void;
  setActiveContext: (context: string) => void;
  setNamespaces: (namespaces: string[]) => void;
  setActiveNamespace: (namespace: string) => void;
  setActiveKind: (kind: ResourceKind) => void;
  setResources: (resources: ResourceSummary[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedResource: (resource: ResourceSummary | null) => void;
  setDetailTab: (tab: "yaml" | "logs" | "events") => void;
}

export const useAppStore = create<AppState>((set) => ({
  contexts: [],
  activeContext: null,
  namespaces: [],
  activeNamespace: "default",
  activeKind: "pods",
  resources: [],
  isLoading: false,
  error: null,
  selectedResource: null,
  detailTab: "yaml",

  setContexts: (contexts) => set({ contexts }),
  setActiveContext: (activeContext) => set({ activeContext }),
  setNamespaces: (namespaces) => set({ namespaces }),
  setActiveNamespace: (activeNamespace) => set({ activeNamespace }),
  setActiveKind: (activeKind) => set({ activeKind, selectedResource: null }),
  setResources: (resources) => set({ resources }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedResource: (selectedResource) => set({ selectedResource }),
  setDetailTab: (detailTab) => set({ detailTab }),
}));
