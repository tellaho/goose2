use crate::types::agents::{CreatePersonaRequest, Persona};
use serde::{Deserialize, Serialize};

/// Sprout-compatible persona JSON format (version 1)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonaCardV1 {
    pub version: u32,
    pub display_name: String,
    pub system_prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

/// Result of parsing an imported file
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedPersona {
    pub display_name: String,
    pub system_prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

/// Skipped file from import
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkippedFile {
    pub filename: String,
    pub reason: String,
}

/// Result of parsing persona files
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseResult {
    pub personas: Vec<ParsedPersona>,
    pub skipped: Vec<SkippedFile>,
}

const MAX_JSON_SIZE: usize = 5 * 1024 * 1024; // 5 MB
const MAX_ZIP_SIZE: usize = 100 * 1024 * 1024; // 100 MB
const MAX_ZIP_ENTRIES: usize = 50;

/// Parse persona file(s) from raw bytes.
/// Supports .persona.json and .zip containing multiple .persona.json files.
pub fn parse_persona_bytes(data: &[u8], filename: &str) -> Result<ParseResult, String> {
    if data.is_empty() {
        return Err("File is empty".to_string());
    }

    // Detect file type by magic bytes
    if data.len() >= 4 && data[0..4] == [0x50, 0x4B, 0x03, 0x04] {
        // ZIP
        if data.len() > MAX_ZIP_SIZE {
            return Err(format!(
                "ZIP file too large (max {} MB)",
                MAX_ZIP_SIZE / 1024 / 1024
            ));
        }
        parse_zip(data)
    } else if data[0] == b'{' {
        // JSON
        if data.len() > MAX_JSON_SIZE {
            return Err(format!(
                "JSON file too large (max {} MB)",
                MAX_JSON_SIZE / 1024 / 1024
            ));
        }
        parse_json(data, filename)
    } else {
        Err("Unsupported file format. Expected .persona.json or .zip".to_string())
    }
}

fn parse_json(data: &[u8], _filename: &str) -> Result<ParseResult, String> {
    let text = std::str::from_utf8(data).map_err(|_| "Invalid UTF-8 in JSON file".to_string())?;

    let card: PersonaCardV1 =
        serde_json::from_str(text).map_err(|e| format!("Invalid persona JSON: {}", e))?;

    if card.display_name.trim().is_empty() {
        return Err("Persona displayName is required".to_string());
    }
    if card.system_prompt.trim().is_empty() {
        return Err("Persona systemPrompt is required".to_string());
    }

    Ok(ParseResult {
        personas: vec![ParsedPersona {
            display_name: card.display_name,
            system_prompt: card.system_prompt,
            avatar_url: card.avatar_url,
            provider: card.provider,
            model: card.model,
        }],
        skipped: vec![],
    })
}

fn parse_zip(data: &[u8]) -> Result<ParseResult, String> {
    let reader = std::io::Cursor::new(data);
    let mut archive =
        zip::ZipArchive::new(reader).map_err(|e| format!("Invalid ZIP archive: {}", e))?;

    let mut personas = Vec::new();
    let mut skipped = Vec::new();
    let mut total_decompressed: usize = 0;

    let count = archive.len().min(MAX_ZIP_ENTRIES);

    for i in 0..count {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Error reading ZIP entry: {}", e))?;

        let name = file.name().to_string();

        // Skip macOS resource forks
        if name.starts_with("__MACOSX/") || name.contains("/._") {
            continue;
        }

        // Only process .json files
        if !name.ends_with(".json") {
            skipped.push(SkippedFile {
                filename: name,
                reason: "Not a .json file".to_string(),
            });
            continue;
        }

        let mut contents = Vec::new();
        std::io::Read::read_to_end(&mut file, &mut contents)
            .map_err(|e| format!("Error reading {}: {}", name, e))?;

        total_decompressed += contents.len();
        if total_decompressed > MAX_ZIP_SIZE {
            return Err("ZIP decompressed content too large".to_string());
        }

        match parse_json(&contents, &name) {
            Ok(result) => personas.extend(result.personas),
            Err(reason) => skipped.push(SkippedFile {
                filename: name,
                reason,
            }),
        }
    }

    if archive.len() > MAX_ZIP_ENTRIES {
        skipped.push(SkippedFile {
            filename: format!("... and {} more entries", archive.len() - MAX_ZIP_ENTRIES),
            reason: format!("Only first {} entries processed", MAX_ZIP_ENTRIES),
        });
    }

    Ok(ParseResult { personas, skipped })
}

/// Export a persona to Sprout-compatible JSON format
pub fn export_persona_to_json(persona: &Persona) -> Result<String, String> {
    let card = PersonaCardV1 {
        version: 1,
        display_name: persona.display_name.clone(),
        system_prompt: persona.system_prompt.clone(),
        avatar_url: persona.avatar_url.clone(),
        provider: persona.provider.clone(),
        model: persona.model.clone(),
    };

    serde_json::to_string_pretty(&card).map_err(|e| format!("Failed to serialize persona: {}", e))
}

/// Convert a ParsedPersona into a CreatePersonaRequest
impl From<ParsedPersona> for CreatePersonaRequest {
    fn from(p: ParsedPersona) -> Self {
        CreatePersonaRequest {
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            system_prompt: p.system_prompt,
            provider: p.provider,
            model: p.model,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_valid_json() {
        let json = r#"{"version":1,"displayName":"Test","systemPrompt":"You are a test agent."}"#;
        let result = parse_persona_bytes(json.as_bytes(), "test.persona.json").unwrap();
        assert_eq!(result.personas.len(), 1);
        assert_eq!(result.personas[0].display_name, "Test");
        assert_eq!(result.personas[0].system_prompt, "You are a test agent.");
    }

    #[test]
    fn reject_empty_name() {
        let json = r#"{"version":1,"displayName":"","systemPrompt":"test"}"#;
        let result = parse_persona_bytes(json.as_bytes(), "test.json");
        assert!(result.is_err());
    }
}
