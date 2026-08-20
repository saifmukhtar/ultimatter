use std::process::{Child, Command, Stdio};
use std::path::PathBuf;

pub struct ProcessSupervisor {
    child: Option<Child>,
}

impl ProcessSupervisor {
    pub fn new() -> Self {
        Self { child: None }
    }

    /// Spawns the Ultimatter gateway daemon if it's not already running.
    pub fn ensure_gateway_running(&mut self) {
        // Quick probe to check if already active on port 5865
        let test_client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_millis(400))
            .build()
            .unwrap_or_default();
        
        if test_client.get("http://127.0.0.1:5865/api/dashboard/status").send().is_ok() {
            // Already running
            return;
        }

        // Locate gateway executable or fallback to node
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let root_dir = manifest_dir.parent().unwrap_or(&manifest_dir);
        let binary_path = root_dir.join("bin").join("ultimatter-linux-x64");
        let index_js_path = root_dir.join("index.js");

        if binary_path.exists() {
            if let Ok(child) = Command::new(&binary_path)
                .arg("--headless")
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn() {
                    self.child = Some(child);
                    return;
                }
        }

        if index_js_path.exists() {
            if let Ok(child) = Command::new("node")
                .arg(&index_js_path)
                .arg("--headless")
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn() {
                    self.child = Some(child);
                }
        }
    }
}

impl Drop for ProcessSupervisor {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}
