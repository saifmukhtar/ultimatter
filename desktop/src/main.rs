mod supervisor;

use std::time::Duration;
use supervisor::ProcessSupervisor;
use tao::{
    dpi::LogicalSize,
    event::{Event, StartCause, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::WebViewBuilder;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Linux GPU / Wayland compatibility hardening
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    // 2. Ensure background gateway daemon is running
    let mut supervisor = ProcessSupervisor::new();
    supervisor.ensure_gateway_running();

    // 3. Wait briefly for port 5865 to be responsive if freshly spawned
    let probe_client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_millis(200))
        .build()
        .unwrap_or_default();
    
    for _ in 0..20 {
        if probe_client.get("http://127.0.0.1:5865/api/dashboard/status").send().is_ok() {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }

    // 4. Initialize native Tao Event Loop and Window
    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("Ultimatter Control Panel")
        .with_inner_size(LogicalSize::new(460.0, 760.0))
        .with_min_inner_size(LogicalSize::new(420.0, 680.0))
        .with_resizable(true)
        .build(&event_loop)?;

    // 5. Initialize Wry WebView loading canonical Dashboard
    let _webview = WebViewBuilder::new()
        .with_url("http://127.0.0.1:5865/dashboard")
        .build(&window)?;

    // 6. Run Event Loop
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::NewEvents(StartCause::Init) => {},
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            _ => (),
        }
    });
}
