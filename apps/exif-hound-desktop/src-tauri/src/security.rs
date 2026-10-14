use std::collections::HashSet;
use std::sync::Mutex;

use once_cell::sync::Lazy;
use url::Url;

static STATE: Lazy<Mutex<SecurityState>> = Lazy::new(|| Mutex::new(SecurityState::default()));

#[derive(Default)]
struct SecurityState {
    trusted_recent_roots: HashSet<String>,
    session_dialog_roots: HashSet<String>,
    remote_image_hosts: HashSet<String>,
    custom_tile_hosts: HashSet<String>,
}

fn normalize_host(host: &str) -> String {
    host.trim().to_lowercase()
}

fn parse_https_url(url: &str) -> Result<Url, String> {
    let parsed = Url::parse(url).map_err(|_| "URL is not valid.".to_string())?;
    if parsed.scheme() != "https" {
        return Err("Only HTTPS URLs are supported.".into());
    }
    if parsed.host_str().unwrap_or("").is_empty() {
        return Err("URL must include a host.".into());
    }
    Ok(parsed)
}

fn app_user_agent() -> String {
    format!(
        "EXIF-Hound/{} (+https://github.com/minimallyexceptional/exif-hound; desktop)",
        env!("EXIFHOUND_APP_VERSION")
    )
}

static HTTP_CLIENT: Lazy<Result<reqwest::blocking::Client, String>> = Lazy::new(|| {
    reqwest::blocking::Client::builder()
        .user_agent(app_user_agent())
        .build()
        .map_err(|error| error.to_string())
});

fn http_client() -> Result<&'static reqwest::blocking::Client, String> {
    HTTP_CLIENT
        .as_ref()
        .map_err(|error| error.clone())
}

fn fetch_https(url: &str) -> Result<Vec<u8>, String> {
    let response = http_client()?
        .get(url)
        .send()
        .map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP request failed ({})", response.status()));
    }
    response
        .bytes()
        .map(|bytes| bytes.to_vec())
        .map_err(|error| error.to_string())
}

fn is_builtin_tile_host(host: &str) -> bool {
    host == "tile.openstreetmap.org"
        || host.ends_with(".tile.openstreetmap.org")
        || host == "tile.openstreetmap.fr"
        || host.ends_with(".tile.openstreetmap.fr")
        || host == "tile.opentopomap.org"
        || host.ends_with(".tile.opentopomap.org")
}

pub fn register_trusted_project_roots(roots: Vec<String>) -> Result<(), String> {
    let mut state = STATE
        .lock()
        .map_err(|_| "Security state lock poisoned.".to_string())?;
    for path in roots {
        let canonical = super::canonical_project_folder(&path)
            .map_err(|error| format!("Trusted project path could not be resolved: {error}"))?;
        state
            .trusted_recent_roots
            .insert(canonical.to_string_lossy().into_owned());
    }
    Ok(())
}

pub fn is_project_folder_allowed(path: &std::path::Path, picked_in_dialog: bool) -> bool {
    let key = path.to_string_lossy().into_owned();
    if picked_in_dialog {
        return true;
    }
    let state = STATE.lock().ok();
    state
        .map(|state| {
            state.trusted_recent_roots.contains(&key) || state.session_dialog_roots.contains(&key)
        })
        .unwrap_or(false)
}

pub fn remember_session_dialog_root(path: &std::path::Path) {
    if let Ok(mut state) = STATE.lock() {
        state
            .session_dialog_roots
            .insert(path.to_string_lossy().into_owned());
    }
}

pub fn register_remote_image_hosts(hosts: Vec<String>) -> Result<(), String> {
    let mut state = STATE
        .lock()
        .map_err(|_| "Security state lock poisoned.".to_string())?;
    state.remote_image_hosts.clear();
    for host in hosts {
        state.remote_image_hosts.insert(normalize_host(&host));
    }
    Ok(())
}

pub fn register_custom_tile_hosts(hosts: Vec<String>) -> Result<(), String> {
    let mut state = STATE
        .lock()
        .map_err(|_| "Security state lock poisoned.".to_string())?;
    state.custom_tile_hosts.clear();
    for host in hosts {
        state.custom_tile_hosts.insert(normalize_host(&host));
    }
    Ok(())
}

pub fn fetch_remote_image_bytes(url: &str) -> Result<Vec<u8>, String> {
    let parsed = parse_https_url(url)?;
    let host = normalize_host(parsed.host_str().unwrap_or(""));
    let allowed = STATE
        .lock()
        .map_err(|_| "Security state lock poisoned.".to_string())?
        .remote_image_hosts
        .contains(&host);
    if !allowed {
        return Err(format!("Loading images from {host} is not enabled."));
    }
    fetch_https(url)
}

pub fn fetch_map_tile_bytes(url: &str) -> Result<Vec<u8>, String> {
    let parsed = parse_https_url(url)?;
    let host = normalize_host(parsed.host_str().unwrap_or(""));
    let allowed = is_builtin_tile_host(&host)
        || STATE
            .lock()
            .map_err(|_| "Security state lock poisoned.".to_string())?
            .custom_tile_hosts
            .contains(&host);
    if !allowed {
        return Err(format!("Map tiles from {host} are not enabled."));
    }
    fetch_https(url)
}

#[cfg(test)]
mod tests {
    use super::is_builtin_tile_host;

    #[test]
    fn builtin_tile_hosts_include_osm_and_opentopo_subdomains() {
        assert!(is_builtin_tile_host("tile.openstreetmap.org"));
        assert!(is_builtin_tile_host("a.tile.openstreetmap.org"));
        assert!(is_builtin_tile_host("c.tile.openstreetmap.fr"));
        assert!(is_builtin_tile_host("b.tile.opentopomap.org"));
        assert!(!is_builtin_tile_host("tiles.example.org"));
    }
}

pub fn fetch_nominatim_bytes(url: &str) -> Result<Vec<u8>, String> {
    let parsed = parse_https_url(url)?;
    let host = normalize_host(parsed.host_str().unwrap_or(""));
    if host != "nominatim.openstreetmap.org" {
        return Err("Reverse geocoding is limited to nominatim.openstreetmap.org.".into());
    }
    fetch_https(url)
}
