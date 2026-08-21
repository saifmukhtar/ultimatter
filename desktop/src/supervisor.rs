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
        // Probe to check if gateway is already active on port 5865
        let test_client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_millis(400))
            .build()
            .unwrap_or_default();
        
        if test_client.get("http://127.0.0.1:5865/api/dashboard/status").send().is_ok() {
            // Already running
            return;
        }

        // Locate gateway entrypoint relative to executable or workspace
        let mut candidates = Vec::new();

        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                candidates.push(exe_dir.join("index.js"));
                candidates.push(exe_dir.join("..").join("index.js"));
            }
        }

        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        candidates.push(manifest_dir.join("..").join("index.js"));
        candidates.push(manifest_dir.join("index.js"));

        for js_path in candidates {
            if js_path.exists() {
                if let Ok(child) = Command::new("node")
                    .arg(&js_path)
                    .arg("--headless")
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn() {
                        self.child = Some(child);
                        return;
                    }
            }
        }
    }

    /// Runs the gateway in foreground mode (for --headless CLI invocation)
    pub fn run_foreground(&mut self) {
        let mut candidates = Vec::new();

        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                candidates.push(exe_dir.join("index.js"));
                candidates.push(exe_dir.join("..").join("index.js"));
            }
        }

        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        candidates.push(manifest_dir.join("..").join("index.js"));
        candidates.push(manifest_dir.join("index.js"));

        for js_path in candidates {
            if js_path.exists() {
                let _ = Command::new("node")
                    .arg(&js_path)
                    .arg("--headless")
                    .status();
                return;
            }
        }

        eprintln!("❌ Ultimatter: Failed to locate gateway index.js");
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
