use kube::{Client, Config};
use kube::config::KubeConfigOptions;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

lazy_static::lazy_static! {
    static ref CLIENTS: Arc<RwLock<HashMap<String, Client>>> = Arc::new(RwLock::new(HashMap::new()));
}

pub async fn get_client(context_name: &str) -> Result<Client, anyhow::Error> {
    // Check cache
    {
        let clients = CLIENTS.read().await;
        if let Some(client) = clients.get(context_name) {
            return Ok(client.clone());
        }
    }

    // Create new client for context
    let options = KubeConfigOptions {
        context: Some(context_name.to_string()),
        ..Default::default()
    };
    let config = Config::from_kubeconfig(&options).await?;
    let client = Client::try_from(config)?;

    // Cache it
    {
        let mut clients = CLIENTS.write().await;
        clients.insert(context_name.to_string(), client.clone());
    }

    Ok(client)
}

#[allow(dead_code)]
pub async fn clear_client(context_name: &str) {
    let mut clients = CLIENTS.write().await;
    clients.remove(context_name);
}
