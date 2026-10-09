#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        // Auto-update support: the updater plugin verifies minisign signatures
        // against the public key baked into the Tauri config
        // before any artifact is installed. The process plugin provides relaunch.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            exit_app,
            force_exit,
            kill_process,
            resolve_project_folder
        ])
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

#[tauri::command]
fn resolve_project_folder(app: tauri::AppHandle, path: String) -> Result<String, String> {
    use tauri_plugin_fs::FsExt;

    let canonical = canonical_project_folder(&path)
        .map_err(|error| format!("Selected folder could not be found: {error}"))?;

    if !canonical.is_dir() {
        return Err("The selected path is not a folder.".into());
    }

    // The dialog may have scoped the unnormalized spelling. Grant the actual
    // directory and its descendants so every project file uses the same path.
    app.fs_scope()
        .allow_directory(&canonical, true)
        .map_err(|error| error.to_string())?;
    canonical
        .to_str()
        .map(str::to_owned)
        .ok_or_else(|| "The selected folder path is not valid UTF-8.".into())
}

fn canonical_project_folder(path: &str) -> std::io::Result<std::path::PathBuf> {
    dunce::canonicalize(path).or_else(|original_error| {
        // A Linux folder picker can return backslashes in an otherwise POSIX
        // path. Only repair it when the literal path does not exist; a real
        // Unix directory with backslashes in its name must remain usable.
        #[cfg(unix)]
        if original_error.kind() == std::io::ErrorKind::NotFound && path.contains('\\') {
            return dunce::canonicalize(path.replace('\\', "/"));
        }
        Err(original_error)
    })
}

#[cfg(all(test, unix))]
mod project_path_tests {
    use super::canonical_project_folder;

    #[test]
    fn repairs_backslashes_only_when_the_literal_unix_path_is_missing() {
        let root = std::env::temp_dir().join(format!(
            "exif-hound-path-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let parent = root.join("Documents").join("Investigations");
        std::fs::create_dir_all(&parent).unwrap();

        let mangled = format!("{}\\Documents\\Investigations", root.display());
        assert_eq!(
            canonical_project_folder(&mangled).unwrap(),
            dunce::canonicalize(&parent).unwrap()
        );

        let literal = std::path::PathBuf::from(&mangled);
        std::fs::create_dir_all(&literal).unwrap();
        assert_eq!(
            canonical_project_folder(&mangled).unwrap(),
            dunce::canonicalize(&literal).unwrap()
        );

        std::fs::remove_dir_all(&literal).unwrap();
        std::fs::remove_dir_all(&root).unwrap();
    }
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
