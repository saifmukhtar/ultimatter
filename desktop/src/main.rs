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
    let args: Vec<String> = std::env::args().collect();

    // 1. Handle CLI Flags
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!(r#"
🚀 Ultimatter

Usage:
  ultimatter [options]

Options:
  --headless       Run in background without launching a desktop GUI window
  -v, --version    Print Ultimatter version and exit
  -h, --help       Show this help message and exit
"#);
        return Ok(());
    }

    if args.iter().any(|a| a == "--version" || a == "-v") {
        println!("v1.0.0");
        return Ok(());
    }

    let mut supervisor = ProcessSupervisor::new();

    // 2. Handle Headless Server Mode
    if args.iter().any(|a| a == "--headless") {
        println!("⚙️  Ultimatter: Running in Headless Server Mode");
        supervisor.run_foreground();
        return Ok(());
    }

    // 3. Desktop GUI Mode: Linux GPU / Wayland compatibility hardening
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    // Ensure background gateway daemon is running
    supervisor.ensure_gateway_running();

    // Wait briefly for port 5865 to be responsive if freshly spawned
    let probe_client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_millis(200))
        .build()
        .unwrap_or_default();
    
    for _ in 0..25 {
        if probe_client.get("http://127.0.0.1:5865/api/dashboard/status").send().is_ok() {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }

    // 4. Initialize native Tao Event Loop and Window
    let event_loop = EventLoop::new();

    // Load native desktop window icon (for OS taskbar, dock, and titlebar)
    let window_icon = {
        const ICON_BYTES: &[u8] = include_bytes!("../../assets/icon.png");
        if let Ok(img) = image::load_from_memory(ICON_BYTES) {
            let rgba = img.into_rgba8();
            let (w, h) = rgba.dimensions();
            tao::window::Icon::from_rgba(rgba.into_raw(), w, h).ok()
        } else {
            None
        }
    };

    let mut window_builder = WindowBuilder::new()
        .with_title("Ultimatter Control Panel")
        .with_inner_size(LogicalSize::new(460.0, 760.0))
        .with_min_inner_size(LogicalSize::new(420.0, 680.0))
        .with_resizable(true);

    if let Some(icon) = window_icon {
        window_builder = window_builder.with_window_icon(Some(icon));
    }

    let window = window_builder.build(&event_loop)?;

    // 5. Initialize Wry WebView (Cross-Platform)
    #[cfg(target_os = "linux")]
    let _webview = {
        use tao::platform::unix::WindowExtUnix;
        use wry::WebViewBuilderExtUnix;

        let vbox = window.default_vbox().expect("Failed to acquire GTK container vbox");
        WebViewBuilder::new()
            .with_url("http://127.0.0.1:5865/dashboard")
            .build_gtk(vbox)?
    };

    #[cfg(not(target_os = "linux"))]
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
