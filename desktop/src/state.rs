use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, Default)]
pub struct GatewayStatus {
    #[serde(rename = "localUrl")]
    pub local_url: Option<String>,
    #[serde(rename = "localDomain")]
    pub local_domain: Option<String>,
    #[serde(rename = "localDomainUrl")]
    pub local_domain_url: Option<String>,
    #[serde(rename = "tailscaleUrl")]
    pub tailscale_url: Option<String>,
    #[serde(rename = "tailscaleState")]
    pub tailscale_state: Option<String>,
    #[serde(rename = "tailscaleAvailable")]
    pub tailscale_available: Option<bool>,
    #[serde(rename = "allowTailscale")]
    pub allow_tailscale: Option<bool>,
    #[serde(rename = "mobileBubbleEnabled")]
    pub mobile_bubble_enabled: Option<bool>,
    #[serde(rename = "ideOnline")]
    pub ide_online: Option<bool>,
    #[serde(rename = "idePort")]
    pub ide_port: Option<u16>,
    #[serde(rename = "agentName")]
    pub agent_name: Option<String>,
    #[serde(rename = "activeCount")]
    pub active_count: Option<u32>,
    pub token: Option<String>,
}

pub struct GatewayClient {
    client: reqwest::blocking::Client,
    base_url: String,
}

impl GatewayClient {
    pub fn new(port: u16) -> Self {
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_millis(1500))
            .build()
            .unwrap_or_default();
        Self {
            client,
            base_url: format!("http://127.0.0.1:{}", port),
        }
    }

    pub fn fetch_status(&self) -> Option<GatewayStatus> {
        let url = format!("{}/api/dashboard/status", self.base_url);
        self.client.get(&url).send().ok()?.json::<GatewayStatus>().ok()
    }

    pub fn toggle_tailscale(&self, next_state: bool) {
        let url = format!("{}/api/dashboard/toggle-tailscale", self.base_url);
        let payload = serde_json::json!({ "allowTailscale": next_state });
        let _ = self.client.post(&url).json(&payload).send();
    }

    pub fn toggle_bubble(&self) {
        let url = format!("{}/api/dashboard/toggle-bubble", self.base_url);
        let _ = self.client.post(&url).send();
    }

    pub fn reset_token(&self) {
        let url = format!("{}/api/dashboard/reset-token", self.base_url);
        let _ = self.client.post(&url).send();
    }
}
