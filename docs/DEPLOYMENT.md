# Deployment Guide

This guide covers deploying Director Assist to various hosting environments. Director Assist is a static Single Page Application (SPA) that can be hosted on any web server or static hosting service.

## Table of Contents

- [Using Pre-Built Releases](#using-pre-built-releases)
- [Building for Production](#building-for-production)
- [Understanding SPA Routing](#understanding-spa-routing)
- [Server Configurations](#server-configurations)
  - [Apache](#apache)
  - [Nginx](#nginx)
  - [Caddy](#caddy)
  - [Rust Web Servers](#rust-web-servers)
- [Static Hosting Services](#static-hosting-services)
  - [GitHub Pages](#github-pages)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
  - [Cloudflare Pages](#cloudflare-pages)
- [Important Considerations](#important-considerations)
  - [Data Storage](#data-storage)
  - [HTTPS Requirements](#https-requirements)
  - [Browser Compatibility](#browser-compatibility)

## Using Pre-Built Releases

The fastest way to deploy Director Assist is to download pre-built files from GitHub releases. This approach requires no Node.js installation or build process.

### Steps

1. Navigate to the [Releases page](https://github.com/evanmiller2112/director-assist/releases)
2. Download `director-assist-[version]-build.zip` from the latest release
3. Extract the zip file to your desired directory:
   ```bash
   unzip director-assist-v0.6.1-build.zip -d /var/www/director-assist
   ```
4. Configure your web server for SPA routing (see [Server Configurations](#server-configurations) below)
5. Access the application through your web server

### What's Included

The pre-built zip file contains:
- `index.html` - Main entry point
- `_app/` - JavaScript, CSS, and other assets
- `favicon.png` and other static files
- All necessary files for a fully functional deployment

### When to Use Pre-Built Releases

Use pre-built releases when:
- You want the fastest deployment path
- You don't need to modify the source code
- You're deploying to production and want official release builds
- You don't have Node.js installed on your server

### When to Build from Source

Build from source when:
- You're developing or testing changes
- You need to modify the application
- You want to use unreleased features from the main branch

## Building for Production

```bash
npm run build
```

This creates a `build` directory containing all static files ready for deployment:

```
build/
├── index.html          # Main entry point
├── _app/               # Application assets (JS, CSS)
├── favicon.png
└── ...
```

## Understanding SPA Routing

Director Assist uses client-side routing. When a user navigates to `/entities/npc/123`, there's no actual file at that path on your server. The routing is handled by JavaScript in the browser.

**The Problem**: If a user bookmarks or refreshes a page like `/entities/npc/123`, the web server looks for a file at that path, doesn't find one, and returns a 404 error.

**The Solution**: Configure your web server to serve `index.html` for any path that doesn't match a real file. This is called a "fallback" or "SPA fallback" configuration. The SvelteKit app then reads the URL and displays the correct content.

Director Assist is already configured for this in `svelte.config.js`:

```javascript
adapter: adapter({
  fallback: 'index.html'  // Generates fallback for SPA routing
})
```

You just need to configure your web server to use this fallback.

## Server Configurations

### Apache

Create a `.htaccess` file in your `build` directory (or configure your virtual host):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Don't rewrite files or directories that exist
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Rewrite everything else to index.html
    RewriteRule ^ index.html [L]
</IfModule>

# Optional: Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Optional: Set caching headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

**Requirements**: Apache must have `mod_rewrite` enabled:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Nginx

Add this to your server block in `/etc/nginx/sites-available/your-site`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/director-assist/build;
    index index.html;

    # SPA fallback - serve index.html for any route
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Caching for static assets
    location /_app/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Optional: Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Caddy

Caddy handles SPA routing automatically with `try_files`. Create a `Caddyfile`:

```caddy
your-domain.com {
    root * /var/www/director-assist/build

    # SPA fallback
    try_files {path} /index.html

    file_server

    # Optional: Compression (enabled by default in Caddy)
    encode gzip
}
```

Or for local development/testing:

```caddy
:8080 {
    root * ./build
    try_files {path} /index.html
    file_server
}
```

### Rust Web Servers

If you're embedding Director Assist in a Rust application or prefer Rust-based servers, here are configurations for popular frameworks.

#### Axum

Using [Axum](https://github.com/tokio-rs/axum) with `tower-http` for static file serving:

```rust
use axum::{Router, routing::get_service};
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    // Serve static files from ./build, fallback to index.html for SPA routing
    let serve_dir = ServeDir::new("build")
        .not_found_service(ServeFile::new("build/index.html"));

    let app = Router::new()
        .fallback_service(get_service(serve_dir));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**Cargo.toml dependencies:**

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower-http = { version = "0.5", features = ["fs"] }
```

#### Rocket

Using [Rocket](https://rocket.rs/) with a custom fallback catcher:

```rust
#[macro_use] extern crate rocket;

use rocket::fs::{FileServer, NamedFile};
use std::path::Path;

// Fallback to index.html for SPA routing
#[catch(404)]
async fn spa_fallback() -> Option<NamedFile> {
    NamedFile::open(Path::new("build/index.html")).await.ok()
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", FileServer::from("build"))
        .register("/", catchers![spa_fallback])
}
```

**Cargo.toml dependencies:**

```toml
[dependencies]
rocket = "0.5"
```

#### Actix Web

Using [Actix Web](https://actix.rs/) with SPA fallback:

```rust
use actix_files::Files;
use actix_web::{App, HttpServer, web, HttpResponse};
use std::path::PathBuf;

async fn spa_fallback() -> actix_web::Result<actix_files::NamedFile> {
    Ok(actix_files::NamedFile::open("build/index.html")?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            // Serve static files
            .service(Files::new("/", "build").index_file("index.html"))
            // Fallback to index.html for SPA routes
            .default_service(web::route().to(spa_fallback))
    })
    .bind(("0.0.0.0", 3000))?
    .run()
    .await
}
```

**Cargo.toml dependencies:**

```toml
[dependencies]
actix-web = "4"
actix-files = "0.6"
```

#### Warp

Using [Warp](https://github.com/seanmonstar/warp) with SPA fallback:

```rust
use warp::Filter;
use std::path::PathBuf;

#[tokio::main]
async fn main() {
    // Serve static files from ./build
    let static_files = warp::fs::dir("build");

    // Fallback to index.html for SPA routing
    let spa_fallback = warp::any()
        .and(warp::fs::file("build/index.html"));

    let routes = static_files.or(spa_fallback);

    println!("Listening on http://0.0.0.0:3000");
    warp::serve(routes).run(([0, 0, 0, 0], 3000)).await;
}
```

**Cargo.toml dependencies:**

```toml
[dependencies]
warp = "0.3"
tokio = { version = "1", features = ["full"] }
```

## Static Hosting Services

These services handle SPA routing automatically or with minimal configuration.

### GitHub Pages

GitHub Pages works well with Director Assist. The build process already includes a `404.html` that handles SPA routing.

1. Build the project: `npm run build`
2. Deploy the `build` directory to your GitHub Pages branch (usually `gh-pages`)

Using GitHub Actions (recommended):

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### Netlify

Netlify handles SPA routing automatically when you configure a redirect rule.

**Option 1**: Add a `_redirects` file to your `static` folder:

```
/*    /index.html   200
```

**Option 2**: Add a `netlify.toml` to your project root:

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

Vercel detects SvelteKit automatically and configures routing correctly.

1. Connect your repository to Vercel
2. Vercel will auto-detect the framework and configure everything

Or add a `vercel.json` for explicit configuration:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Cloudflare Pages handles SPA routing automatically

## Important Considerations

### Data Storage

Director Assist stores all data locally in your browser using IndexedDB:

- **No backend required**: The app is entirely client-side
- **Data stays local**: Your campaign data never leaves your browser
- **Browser-specific**: Data is tied to the specific browser and device
- **Not synced**: Different browsers/devices have separate data stores

**Implications for deployment**:

- You don't need a database or server-side code
- Users should export regular backups (Settings → Export Backup)
- If users clear browser data, their campaigns are lost unless backed up
- Private/incognito mode may not persist data

### HTTPS Requirements

Several browser APIs used by Director Assist work best (or only) over HTTPS:

| Feature | HTTP | HTTPS |
|---------|------|-------|
| IndexedDB | Works* | Works |
| Clipboard API | Limited | Full |
| Service Workers | No | Yes |

*IndexedDB works over HTTP but some browsers may limit storage quotas.

**Recommendation**: Always deploy with HTTPS. All the static hosting services mentioned above provide free HTTPS certificates.

For self-hosted deployments:
- Use Let's Encrypt for free SSL certificates
- Caddy provides automatic HTTPS
- Use a reverse proxy like Cloudflare for HTTPS termination

### Browser Compatibility

Director Assist requires a modern browser with IndexedDB support:

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

Mobile browsers are supported but the interface is optimized for desktop use.

## Troubleshooting

### "Page not found" on refresh

Your server isn't configured for SPA routing. Check that:
1. The fallback rule is in place (see [Server Configurations](#server-configurations))
2. Apache has `mod_rewrite` enabled
3. Nginx configuration was reloaded after changes

### Blank page after deployment

1. Check browser console for errors
2. Verify all files were uploaded (especially the `_app` directory)
3. Check that paths are correct (no extra subdirectory in URLs)

### Data not persisting

1. Ensure you're using HTTPS
2. Check you're not in private/incognito mode
3. Verify browser hasn't blocked IndexedDB for the site

## Need Help?

If you encounter deployment issues, [open an issue on GitHub](https://github.com/evanmiller2112/director-assist/issues) with:
- Your hosting environment
- Server configuration (if self-hosted)
- Browser console errors (if any)
