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
            resolve_project_folder,
            save_workflow_template,
            list_workflow_templates
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

#[derive(serde::Serialize)]
struct WorkflowTemplate {
    name: String,
    content: String,
}

fn workflow_library_dir(home: &std::path::Path) -> std::path::PathBuf {
    home.join(".exif-hound").join("workflows")
}

fn validate_workflow_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() || trimmed != name || trimmed == "." || trimmed == ".." {
        return Err("Enter a workflow name without leading or trailing spaces.".into());
    }
    if name
        .chars()
        .any(|ch| ch.is_control() || "<>:\"/\\|?*".contains(ch))
    {
        return Err(
            "Workflow name contains characters that are not supported on all platforms.".into(),
        );
    }
    if name.ends_with('.') || name.ends_with(' ') {
        return Err("Workflow names cannot end with a dot or space.".into());
    }
    let device_name = name.split('.').next().unwrap_or(name).to_ascii_uppercase();
    let reserved = matches!(device_name.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (1..=9).any(|number| {
            device_name == format!("COM{number}") || device_name == format!("LPT{number}")
        });
    if reserved {
        return Err("Workflow name is reserved by a supported operating system.".into());
    }
    Ok(())
}

fn normalize_workflow_name(name: &str) -> String {
    use unicode_normalization::UnicodeNormalization;
    name.nfc().flat_map(char::to_lowercase).collect()
}

fn is_json_file(path: &std::path::Path) -> bool {
    path.extension()
        .is_some_and(|extension| extension.to_string_lossy().eq_ignore_ascii_case("json"))
}

fn save_workflow_file(
    directory: &std::path::Path,
    name: &str,
    content: &str,
) -> Result<(), String> {
    validate_workflow_name(name)?;
    let parsed: serde_json::Value = serde_json::from_str(content)
        .map_err(|error| format!("Workflow JSON is invalid: {error}"))?;
    if parsed.get("formatVersion").and_then(|value| value.as_u64()) != Some(1) {
        return Err("Workflow JSON uses an unsupported format.".into());
    }
    std::fs::create_dir_all(directory)
        .map_err(|error| format!("Could not create workflow library: {error}"))?;
    let destination = directory.join(format!("{name}.json"));
    if directory
        .read_dir()
        .map_err(|error| error.to_string())?
        .flatten()
        .any(|entry| {
            let path = entry.path();
            is_json_file(&path)
                && path.file_stem().is_some_and(|stem| {
                    normalize_workflow_name(&stem.to_string_lossy())
                        == normalize_workflow_name(name)
                })
        })
    {
        return Err("A workflow with this name already exists.".into());
    }
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let temporary = directory.join(format!(".workflow-{}-{nonce}.tmp", std::process::id()));
    let result = (|| -> std::io::Result<()> {
        use std::io::Write;
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        // Publishing with a hard link is atomic and fails if the name already
        // exists, so concurrent app instances cannot silently replace a file.
        std::fs::hard_link(&temporary, &destination)?;
        let _ = std::fs::remove_file(&temporary);
        Ok(())
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&temporary);
    }
    result.map_err(|error| format!("Could not save workflow: {error}"))
}

fn list_workflow_files(directory: &std::path::Path) -> Result<Vec<WorkflowTemplate>, String> {
    if !directory.exists() {
        return Ok(Vec::new());
    }
    let entries = std::fs::read_dir(directory)
        .map_err(|error| format!("Could not read workflow library: {error}"))?;
    let mut workflows = Vec::new();
    for entry in entries {
        let path = entry.map_err(|error| error.to_string())?.path();
        if !is_json_file(&path) || !path.is_file() {
            continue;
        }
        let content = std::fs::read_to_string(&path)
            .map_err(|error| format!("Could not read workflow file: {error}"))?;
        let Ok(value) = serde_json::from_str::<serde_json::Value>(&content) else {
            continue;
        };
        if value
            .get("formatVersion")
            .and_then(|version| version.as_u64())
            != Some(1)
        {
            continue;
        }
        let Some(name) = path.file_stem().and_then(|value| value.to_str()) else {
            continue;
        };
        workflows.push(WorkflowTemplate {
            name: name.to_owned(),
            content,
        });
    }
    workflows
        .sort_by(|a, b| normalize_workflow_name(&a.name).cmp(&normalize_workflow_name(&b.name)));
    Ok(workflows)
}

#[tauri::command]
fn save_workflow_template(
    app: tauri::AppHandle,
    name: String,
    content: String,
) -> Result<(), String> {
    let home = app
        .path()
        .home_dir()
        .map_err(|error| format!("Could not locate the user home directory: {error}"))?;
    save_workflow_file(&workflow_library_dir(&home), &name, &content)
}

#[tauri::command]
fn list_workflow_templates(app: tauri::AppHandle) -> Result<Vec<WorkflowTemplate>, String> {
    let home = app
        .path()
        .home_dir()
        .map_err(|error| format!("Could not locate the user home directory: {error}"))?;
    list_workflow_files(&workflow_library_dir(&home))
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

#[cfg(test)]
mod workflow_library_tests {
    use super::{
        list_workflow_files, normalize_workflow_name, save_workflow_file, validate_workflow_name,
        workflow_library_dir,
    };

    #[test]
    fn workflow_library_uses_home_relative_native_paths() {
        let path = workflow_library_dir(std::path::Path::new("portable-home"));
        assert!(path.ends_with(std::path::Path::new(".exif-hound").join("workflows")));
    }

    #[test]
    fn workflow_names_are_portable_and_case_collisions_are_rejected() {
        assert!(validate_workflow_name("Field notes – café").is_ok());
        assert!(validate_workflow_name("CON").is_err());
        assert!(validate_workflow_name("..").is_err());
        assert!(validate_workflow_name("bad/name").is_err());
        assert_eq!(
            normalize_workflow_name("Café"),
            normalize_workflow_name("CAFE\u{301}")
        );
        let directory =
            std::env::temp_dir().join(format!("workflow-library-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&directory);
        let json = r#"{"formatVersion":1}"#;
        save_workflow_file(&directory, "Case", json).unwrap();
        assert!(save_workflow_file(&directory, "case", json).is_err());
        assert_eq!(
            std::fs::read_to_string(directory.join("Case.json")).unwrap(),
            json
        );
        std::fs::write(directory.join("broken.json"), "not json").unwrap();
        std::fs::write(directory.join("unsupported.json"), r#"{"formatVersion":2}"#).unwrap();
        let listed = list_workflow_files(&directory).unwrap();
        assert_eq!(
            listed
                .iter()
                .map(|item| item.name.as_str())
                .collect::<Vec<_>>(),
            vec!["Case"]
        );
        std::fs::remove_dir_all(directory).unwrap();
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
use tauri::Manager;
