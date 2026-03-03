use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct PortForwardSession {
    pub id: String,
    pub pod: String,
    pub namespace: String,
    pub local_port: u16,
    pub remote_port: u16,
}

lazy_static::lazy_static! {
    static ref SESSIONS: Arc<RwLock<HashMap<String, tokio::task::JoinHandle<()>>>> =
        Arc::new(RwLock::new(HashMap::new()));
    static ref SESSION_INFO: Arc<RwLock<HashMap<String, PortForwardSession>>> =
        Arc::new(RwLock::new(HashMap::new()));
}

pub async fn start_port_forward(
    client: kube::Client,
    pod: &str,
    namespace: &str,
    local_port: u16,
    remote_port: u16,
) -> Result<PortForwardSession, anyhow::Error> {
    use k8s_openapi::api::core::v1::Pod;
    use kube::Api;
    use tokio::net::TcpListener;

    let api: Api<Pod> = Api::namespaced(client.clone(), namespace);
    let id = format!("{}:{}->{}", pod, local_port, remote_port);

    let pod_name = pod.to_string();
    let remote = remote_port;

    let handle = tokio::spawn(async move {
        let listener = match TcpListener::bind(format!("127.0.0.1:{}", local_port)).await {
            Ok(l) => l,
            Err(e) => { eprintln!("Port forward bind error: {}", e); return; }
        };

        while let Ok((mut client_stream, _)) = listener.accept().await {
            let api = api.clone();
            let pod = pod_name.clone();
            tokio::spawn(async move {
                let mut pf = match api.portforward(&pod, &[remote]).await {
                    Ok(pf) => pf,
                    Err(e) => { eprintln!("Portforward error: {}", e); return; }
                };
                if let Some(mut upstream) = pf.take_stream(remote) {
                    let _ = tokio::io::copy_bidirectional(&mut client_stream, &mut upstream).await;
                }
            });
        }
    });

    let session = PortForwardSession {
        id: id.clone(),
        pod: pod.to_string(),
        namespace: namespace.to_string(),
        local_port,
        remote_port,
    };

    SESSIONS.write().await.insert(id.clone(), handle);
    SESSION_INFO.write().await.insert(id, session.clone());

    Ok(session)
}

pub async fn stop_port_forward(id: &str) -> Result<(), anyhow::Error> {
    if let Some(handle) = SESSIONS.write().await.remove(id) {
        handle.abort();
    }
    SESSION_INFO.write().await.remove(id);
    Ok(())
}

pub async fn list_port_forwards() -> Vec<PortForwardSession> {
    SESSION_INFO.read().await.values().cloned().collect()
}
