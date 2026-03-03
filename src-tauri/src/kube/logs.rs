use futures::{AsyncBufReadExt, TryStreamExt};
use kube::Api;
use kube::api::LogParams;
use k8s_openapi::api::core::v1::Pod;
use tauri::{AppHandle, Emitter};

pub async fn stream_logs(
    app: AppHandle,
    client: kube::Client,
    pod_name: &str,
    container: Option<&str>,
    namespace: &str,
    follow: bool,
    tail_lines: Option<i64>,
) -> Result<(), anyhow::Error> {
    let api: Api<Pod> = Api::namespaced(client, namespace);
    let mut lp = LogParams {
        follow,
        tail_lines,
        ..Default::default()
    };
    if let Some(c) = container {
        lp.container = Some(c.to_string());
    }

    let reader = api.log_stream(pod_name, &lp).await?;
    let pod_name = pod_name.to_string();

    tokio::spawn(async move {
        let buf = futures::io::BufReader::new(reader);
        let mut lines = buf.lines();
        while let Ok(Some(line)) = lines.try_next().await {
            let _ = app.emit("log_line", serde_json::json!({
                "pod": pod_name,
                "line": line,
            }));
        }
    });

    Ok(())
}
