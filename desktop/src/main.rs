slint::include_modules!();

mod qr;
mod state;
mod supervisor;

use std::sync::{Arc, Mutex};
use std::time::Duration;
use arboard::Clipboard;
use state::{GatewayClient, GatewayStatus};
use supervisor::ProcessSupervisor;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Ensure background gateway is running
    let mut supervisor = ProcessSupervisor::new();
    supervisor.ensure_gateway_running();

    // 2. Initialize UI
    let app = AppWindow::new()?;
    let app_weak = app.as_weak();
    let client = Arc::new(GatewayClient::new(5865));
    let last_status = Arc::new(Mutex::new(GatewayStatus::default()));

    // Initial default image
    app.set_qr_image(qr::generate_qr_image("https://127.0.0.1:5864/"));

    // 3. Setup Callbacks
    {
        let app_weak = app_weak.clone();
        app.on_set_mode(move |mode| {
            if let Some(app) = app_weak.upgrade() {
                app.set_active_tab(mode);
            }
        });
    }

    {
        let app_weak = app_weak.clone();
        app.on_copy_link(move || {
            if let Some(app) = app_weak.upgrade() {
                let link = app.get_direct_link().to_string();
                if let Ok(mut clipboard) = Clipboard::new() {
                    let _ = clipboard.set_text(link);
                    app.set_copy_btn_text("Copied!".into());
                    
                    let app_timer = app_weak.clone();
                    slint::Timer::single_shot(Duration::from_millis(2000), move || {
                        if let Some(app) = app_timer.upgrade() {
                            app.set_copy_btn_text("Copy".into());
                        }
                    });
                }
            }
        });
    }

    {
        let client = client.clone();
        let app_weak = app_weak.clone();
        app.on_toggle_remote_access(move || {
            if let Some(app) = app_weak.upgrade() {
                let current = app.get_remote_access_enabled();
                client.toggle_tailscale(!current);
                app.set_remote_access_enabled(!current);
            }
        });
    }

    {
        let client = client.clone();
        let app_weak = app_weak.clone();
        app.on_toggle_bubble(move || {
            if let Some(app) = app_weak.upgrade() {
                let current = app.get_bubble_enabled();
                client.toggle_bubble();
                app.set_bubble_enabled(!current);
            }
        });
    }

    {
        let client = client.clone();
        app.on_reset_token(move || {
            client.reset_token();
        });
    }

    {
        app.on_copy_opencode_cmd(move || {
            if let Ok(mut clipboard) = Clipboard::new() {
                let _ = clipboard.set_text("opencode web".to_string());
            }
        });
    }

    {
        app.on_copy_tailscale_cmd(move || {
            if let Ok(mut clipboard) = Clipboard::new() {
                let _ = clipboard.set_text("sudo tailscale up".to_string());
            }
        });
    }

    // 4. Background Status Sync Timer (every 1.5 seconds)
    let timer = slint::Timer::default();
    let client_sync = client.clone();
    let last_status_sync = last_status.clone();
    let app_weak_sync = app_weak.clone();

    timer.start(slint::TimerMode::Repeated, Duration::from_millis(1500), move || {
        let client = client_sync.clone();
        let app_weak = app_weak_sync.clone();
        let last_status = last_status_sync.clone();

        // Perform HTTP fetch on worker thread to prevent any UI stutter
        std::thread::spawn(move || {
            if let Some(status) = client.fetch_status() {
                let mut guard = last_status.lock().unwrap();
                *guard = status.clone();
                drop(guard);

                slint::invoke_from_event_loop(move || {
                    if let Some(app) = app_weak.upgrade() {
                        let is_tailscale = app.get_active_tab() == "tailscale";
                        let is_domain = app.get_local_sub_mode() == "domain";

                        // 1. Resolve Active URL & QR
                        let direct_url = if is_tailscale {
                            status.tailscale_url.clone().unwrap_or_default()
                        } else if is_domain {
                            status.local_domain_url.clone().or(status.local_url.clone()).unwrap_or_default()
                        } else {
                            status.local_url.clone().unwrap_or_default()
                        };

                        if !direct_url.is_empty() && app.get_direct_link() != direct_url.as_str() {
                            app.set_direct_link(direct_url.as_str().into());
                            app.set_qr_image(qr::generate_qr_image(&direct_url));
                        }

                        // 2. Status Pill
                        let active_count = status.active_count.unwrap_or(if status.ide_online.unwrap_or(false) { 1 } else { 0 });
                        app.set_active_count(active_count as i32);
                        app.set_show_smart_card(active_count == 0);

                        if active_count > 1 {
                            app.set_status_online(true);
                            app.set_status_text(format!("{} Agents Active", active_count).into());
                        } else if status.ide_online.unwrap_or(false) {
                            app.set_status_online(true);
                            let name = status.agent_name.unwrap_or_else(|| "Agent".into());
                            let port = status.ide_port.unwrap_or(0);
                            app.set_status_text(format!("{} Connected :{}", name, port).into());
                        } else {
                            app.set_status_online(false);
                            app.set_status_text("Agents Offline".into());
                        }

                        // 3. Security Settings
                        if let Some(allow_ts) = status.allow_tailscale {
                            app.set_remote_access_enabled(allow_ts);
                        }
                        if let Some(bubble) = status.mobile_bubble_enabled {
                            app.set_bubble_enabled(bubble);
                        }
                        if let Some(ts_state) = status.tailscale_state {
                            app.set_tailscale_state(ts_state.into());
                        }
                        if let Some(domain) = status.local_domain {
                            app.set_local_domain(domain.into());
                        }
                    }
                }).unwrap_or_default();
            }
        });
    });

    // 5. Run native application event loop
    app.run()?;

    Ok(())
}
