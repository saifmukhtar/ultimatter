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
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_millis(500))
            .build()
            .unwrap_or_default();

        // Double-probe liveness check: if the first probe succeeds we cannot
        // trust it yet — the port may belong to a dying backend whose AppImage
        // filesystem is already being unmounted. We wait 2 s and probe again.
        // Only skip spawning if BOTH probes return a healthy response, proving
        // the existing backend is truly stable.
        let probe_url = "http://127.0.0.1:5865/api/dashboard/status";
        let first_ok = client.get(probe_url).send().is_ok();
        if first_ok {
            std::thread::sleep(std::time::Duration::from_millis(2000));
            if client.get(probe_url).send().is_ok() {
                // Confirmed stable — nothing to do.
                return;
            }
            // First probe lied (stale backend died). Fall through and spawn fresh.
        }

        // 1. First probe for standalone sibling backend binary (packaged inside AppImage / macOS bundle / Windows)
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let backend_candidates = [
                    exe_dir.join("ultimatter-backend"),
                    exe_dir.join("ultimatter-backend.exe"),
                    exe_dir.join("resources").join("ultimatter-backend"),
                    exe_dir.join("..").join("Resources").join("ultimatter-backend"),
                ];
                for backend_path in backend_candidates {
                    if backend_path.exists() {
                        if let Ok(child) = Command::new(&backend_path)
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
        }

        // 2. Fall back to local source index.js via Node.js
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
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let backend_candidates = [
                    exe_dir.join("ultimatter-backend"),
                    exe_dir.join("ultimatter-backend.exe"),
                    exe_dir.join("resources").join("ultimatter-backend"),
                    exe_dir.join("..").join("Resources").join("ultimatter-backend"),
                ];
                for backend_path in backend_candidates {
                    if backend_path.exists() {
                        let _ = Command::new(&backend_path)
                            .arg("--headless")
                            .status();
                        return;
                    }
                }
            }
        }

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

        eprintln!("❌ Ultimatter: Failed to locate gateway index.js or backend binary");
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
