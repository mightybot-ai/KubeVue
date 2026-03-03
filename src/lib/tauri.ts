import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface ClusterContext {
  name: string;
  cluster: string;
  user: string;
  namespace: string | null;
  is_active: boolean;
}

export interface ResourceSummary {
  name: string;
  namespace: string | null;
  kind: string;
  status: string;
  age: string;
  labels: Record<string, string>;
  raw: any;
}

export const api = {
  listContexts: () => invoke<ClusterContext[]>("list_contexts"),
  listNamespaces: (context: string) => invoke<string[]>("list_namespaces", { context }),
  listResources: (context: string, kind: string, namespace: string) =>
    invoke<ResourceSummary[]>("list_resources", { context, kind, namespace }),
  getResourceYaml: (context: string, kind: string, name: string, namespace: string) =>
    invoke<string>("get_resource_yaml", { context, kind, name, namespace }),
  deleteResource: (context: string, kind: string, name: string, namespace: string) =>
    invoke<void>("delete_resource", { context, kind, name, namespace }),
  scaleDeployment: (context: string, name: string, namespace: string, replicas: number) =>
    invoke<void>("scale_deployment", { context, name, namespace, replicas }),
  restartDeployment: (context: string, name: string, namespace: string) =>
    invoke<void>("restart_deployment", { context, name, namespace }),
  streamLogs: (context: string, pod: string, container: string | null, namespace: string, follow: boolean, tailLines: number | null) =>
    invoke<void>("stream_logs", { context, pod, container, namespace, follow, tailLines }),
  watchResources: (context: string, kind: string, namespace: string) =>
    invoke<void>("watch_resources", { context, kind, namespace }),
};

export const events = {
  onResourceChanged: (callback: (data: any) => void): Promise<UnlistenFn> =>
    listen("resource_changed", (event) => callback(event.payload)),
  onLogLine: (callback: (data: { pod: string; line: string }) => void): Promise<UnlistenFn> =>
    listen("log_line", (event) => callback(event.payload as any)),
  onLogError: (callback: (data: { pod: string; error: string }) => void): Promise<UnlistenFn> =>
    listen("log_error", (event) => callback(event.payload as any)),
};
