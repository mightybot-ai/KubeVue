use futures::StreamExt;
use kube::{Api, Client};
use kube::runtime::watcher;
use kube::runtime::watcher::Event as WatchEvent;
use k8s_openapi::api::core::v1::Pod;
use k8s_openapi::api::apps::v1::Deployment;
use serde::Serialize;
use tauri::{AppHandle, Emitter};


#[derive(Debug, Clone, Serialize)]
pub struct WatchDelta {
    pub kind: String,
    pub event_type: String,
    pub name: String,
    pub namespace: Option<String>,
    pub resource: serde_json::Value,
}

pub async fn watch_resources(
    app: AppHandle,
    client: Client,
    kind: &str,
    namespace: &str,
) -> Result<(), anyhow::Error> {
    let kind = kind.to_string();
    let namespace = namespace.to_string();

    tokio::spawn(async move {
        match kind.as_str() {
            "pods" => watch_typed::<Pod>(app, client, &namespace).await,
            "deployments" => watch_typed::<Deployment>(app, client, &namespace).await,
            _ => {}
        }
    });

    Ok(())
}

async fn watch_typed<K>(app: AppHandle, client: Client, namespace: &str)
where
    K: kube::Resource<Scope = k8s_openapi::NamespaceResourceScope>
        + Clone
        + std::fmt::Debug
        + serde::de::DeserializeOwned
        + serde::Serialize
        + Send
        + 'static,
    K: kube::ResourceExt,
    <K as kube::Resource>::DynamicType: Default,
{
    let api: Api<K> = if namespace == "_all" {
        Api::all(client)
    } else {
        Api::namespaced(client, namespace)
    };

    let wc = watcher::Config::default();
    let mut stream = watcher(api, wc).boxed();

    while let Some(event) = stream.next().await {
        match event {
            Ok(WatchEvent::Apply(obj)) => {
                let delta = WatchDelta {
                    kind: std::any::type_name::<K>().to_string(),
                    event_type: "applied".to_string(),
                    name: obj.name_any(),
                    namespace: obj.namespace(),
                    resource: serde_json::to_value(&obj).unwrap_or_default(),
                };
                let _ = app.emit("resource_changed", &delta);
            }
            Ok(WatchEvent::Delete(obj)) => {
                let delta = WatchDelta {
                    kind: std::any::type_name::<K>().to_string(),
                    event_type: "deleted".to_string(),
                    name: obj.name_any(),
                    namespace: obj.namespace(),
                    resource: serde_json::to_value(&obj).unwrap_or_default(),
                };
                let _ = app.emit("resource_changed", &delta);
            }
            Ok(WatchEvent::Init | WatchEvent::InitApply(_) | WatchEvent::InitDone) => {}
            Err(e) => {
                let _ = app.emit("watch_error", e.to_string());
            }
        }
    }
}
