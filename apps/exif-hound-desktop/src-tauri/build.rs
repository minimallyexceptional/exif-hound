fn main() {
    let conf: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string("tauri.conf.json").expect("read tauri.conf.json"),
    )
    .expect("parse tauri.conf.json");
    let version = conf["version"].as_str().expect("tauri.conf.json version");
    println!("cargo:rustc-env=EXIFHOUND_APP_VERSION={version}");
    tauri_build::build();
}
