#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        // Auto-update support: the updater plugin verifies minisign signatures
        // against the public key baked into the Tauri config
        // before any artifact is installed. The process plugin provides relaunch.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![exit_app, force_exit, kill_process])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                println!("Tauri app initialized with plugins: dialog, fs, http");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Command to exit the application
#[tauri::command]
fn exit_app() {
    println!("exit_app command received, terminating application...");
    std::process::exit(0);
}

// More forceful alternative exit method
#[tauri::command]
fn force_exit() {
    println!("force_exit command received, forcefully terminating process");
    std::process::exit(1);
}

// Most extreme option - fully abort
#[tauri::command]
fn kill_process() {
    println!("kill_process command received, aborting immediately");
    std::process::abort();
}
