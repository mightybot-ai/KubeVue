use kube::config::Kubeconfig;
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
pub struct ClusterContext {
    pub name: String,
    pub cluster: String,
    pub user: String,
    pub namespace: Option<String>,
    pub is_active: bool,
}

#[allow(dead_code)]
pub fn get_kubeconfig_path() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_default();
    std::env::var("KUBECONFIG")
        .map(PathBuf::from)
        .unwrap_or_else(|_| home.join(".kube").join("config"))
}

pub async fn list_contexts() -> Result<Vec<ClusterContext>, anyhow::Error> {
    let kubeconfig = Kubeconfig::read()?;
    let current_context = kubeconfig.current_context.clone().unwrap_or_default();

    let contexts = kubeconfig
        .contexts
        .iter()
        .map(|ctx| {
            let context = ctx.context.as_ref();
            ClusterContext {
                name: ctx.name.clone(),
                cluster: context.map(|c| c.cluster.clone()).unwrap_or_default(),
                user: context.and_then(|c| c.user.clone()).unwrap_or_default(),
                namespace: context.and_then(|c| c.namespace.clone()),
                is_active: ctx.name == current_context,
            }
        })
        .collect();

    Ok(contexts)
}

pub async fn list_namespaces(context_name: &str) -> Result<Vec<String>, anyhow::Error> {
    let client = super::client::get_client(context_name).await?;
    let namespaces: kube::Api<k8s_openapi::api::core::v1::Namespace> = kube::Api::all(client);
    let ns_list = namespaces.list(&Default::default()).await?;
    let names: Vec<String> = ns_list.items.iter().filter_map(|ns| ns.metadata.name.clone()).collect();
    Ok(names)
}
