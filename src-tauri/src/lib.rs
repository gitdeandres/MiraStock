// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::PathBuf;
use tauri::{Manager};
use tauri_plugin_log::{Target, TargetKind, RotationStrategy};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
            .rotation_strategy(RotationStrategy::KeepOne)
            .max_file_size(5_000_000) // 5 MB
            .targets([
                Target::new(TargetKind::Folder {
                  path:  PathBuf::from("logs"),
                  file_name: Some("app".to_string())
                }),
                Target::new(TargetKind::Stdout),
            ])
            .build(),
        )
        .setup(|app| {
            // 🚀 Leer argumentos de línea de comandos
            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--fullscreen".to_string()) {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_fullscreen(true)?;
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
