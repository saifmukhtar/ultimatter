class Ultimatter < Formula
  desc "Universal AI Agent Gateway for Antigravity and OpenCode"
  homepage "https://github.com/saifmukhtar/ultimatter"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/saifmukhtar/ultimatter/releases/download/v1.0.0/ultimatter-macos-arm64.tar.gz"
    else
      url "https://github.com/saifmukhtar/ultimatter/releases/download/v1.0.0/ultimatter-macos-x64.tar.gz"
    end

    def install
      bin.install "ultimatter"
    end
  end

  on_linux do
    url "https://github.com/saifmukhtar/ultimatter/releases/download/v1.0.0/ultimatter-linux-x64.tar.gz"

    def install
      bin.install "ultimatter-linux-x64" => "ultimatter"
    end
  end

  test do
    system "#{bin}/ultimatter", "--version"
  end
end
