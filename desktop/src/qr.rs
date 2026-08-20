use qrcode::{QrCode, Version, EcLevel};
use slint::{Image, SharedPixelBuffer, Rgba8Pixel};

/// Generates a crisp, high-resolution Slint Image for the given URL payload.
pub fn generate_qr_image(payload: &str) -> Image {
    if payload.is_empty() {
        return Image::default();
    }

    let code = match QrCode::with_version(payload, Version::Normal(4), EcLevel::M)
        .or_else(|_| QrCode::new(payload)) {
            Ok(c) => c,
            Err(_) => return Image::default(),
        };

    let qr_width = code.width();
    let quiet_zone = 2; // quiet zone margin
    let total_modules = qr_width + (quiet_zone * 2);
    let scale = 6; // pixel scale per module for crisp high-DPI rendering
    let img_dim = (total_modules * scale) as u32;

    let mut pixel_buffer = SharedPixelBuffer::<Rgba8Pixel>::new(img_dim, img_dim);
    let slice = pixel_buffer.make_mut_slice();

    let bg_color = Rgba8Pixel { r: 255, g: 255, b: 255, a: 255 };
    let fg_color = Rgba8Pixel { r: 15, g: 23, b: 42, a: 255 }; // #0f172a slate-900

    // Fill background
    for pixel in slice.iter_mut() {
        *pixel = bg_color;
    }

    // Render QR modules
    for y in 0..qr_width {
        for x in 0..qr_width {
            if code[(x, y)] == qrcode::Color::Dark {
                let start_px = ((x + quiet_zone) * scale) as u32;
                let start_py = ((y + quiet_zone) * scale) as u32;

                for py in start_py..(start_py + scale as u32) {
                    for px in start_px..(start_px + scale as u32) {
                        let idx = (py * img_dim + px) as usize;
                        if idx < slice.len() {
                            slice[idx] = fg_color;
                        }
                    }
                }
            }
        }
    }

    Image::from_rgba8(pixel_buffer)
}
