fn main() {
    #[cfg(windows)]
    {
        let mut res = winres::WindowsResource::new();
        res.set_icon("../assets/icon.ico");
        res.set("ProductName", "Ultimatter");
        res.set("FileDescription", "Ultimatter Universal AI Gateway");
        res.set("LegalCopyright", "Copyright (c) 2026 Ultimatter");
        if let Err(e) = res.compile() {
            eprintln!("Warning: Failed to compile Windows resource icon: {}", e);
        }
    }
}
