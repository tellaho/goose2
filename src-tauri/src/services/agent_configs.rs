use crate::types::agents::{AgentConfig, CreateAgentConfigRequest, UpdateAgentConfigRequest};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AgentConfigStore {
    configs: Mutex<Vec<AgentConfig>>,
    agents_dir: PathBuf,
}

impl AgentConfigStore {
    pub fn new() -> Self {
        let agents_dir = dirs::home_dir()
            .expect("home dir")
            .join(".goose")
            .join("agents");
        let configs = Self::scan_directory(&agents_dir);
        Self {
            configs: Mutex::new(configs),
            agents_dir,
        }
    }

    fn scan_directory(dir: &PathBuf) -> Vec<AgentConfig> {
        let mut configs = Vec::new();
        let entries = match std::fs::read_dir(dir) {
            Ok(entries) => entries,
            Err(_) => return configs,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "md") {
                if let Some(config) = Self::parse_agent_file(&path) {
                    configs.push(config);
                }
            }
        }

        configs.sort_by(|a, b| a.name.cmp(&b.name));
        configs
    }

    fn parse_agent_file(path: &std::path::Path) -> Option<AgentConfig> {
        let content = std::fs::read_to_string(path).ok()?;
        let (name, description, instructions) = Self::parse_frontmatter(&content)?;

        let metadata = std::fs::metadata(path).ok()?;
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| {
                let duration = t.duration_since(std::time::UNIX_EPOCH).ok()?;
                Some(chrono::DateTime::from_timestamp(duration.as_secs() as i64, 0)?.to_rfc3339())
            })
            .unwrap_or_default();

        let file_stem = path.file_stem()?.to_string_lossy().to_string();

        Some(AgentConfig {
            id: file_stem,
            name,
            description,
            file_path: path.to_string_lossy().to_string(),
            source: "user".to_string(),
            last_modified: modified,
            instructions,
        })
    }

    fn parse_frontmatter(content: &str) -> Option<(String, Option<String>, String)> {
        let trimmed = content.trim();
        if !trimmed.starts_with("---") {
            // No frontmatter — use the whole content as instructions, derive name from first heading
            let name = trimmed
                .lines()
                .find(|l| l.starts_with("# "))
                .map(|l| l.trim_start_matches("# ").to_string())
                .unwrap_or_else(|| "Untitled".to_string());
            return Some((name, None, trimmed.to_string()));
        }

        // Find closing ---
        let rest = &trimmed[3..];
        let end = rest.find("\n---")?;
        let frontmatter = &rest[..end];
        let instructions = rest[end + 4..].trim().to_string();

        let mut name = None;
        let mut description = None;

        for line in frontmatter.lines() {
            let line = line.trim();
            if let Some(val) = line.strip_prefix("name:") {
                name = Some(val.trim().trim_matches('"').trim_matches('\'').to_string());
            } else if let Some(val) = line.strip_prefix("description:") {
                let d = val.trim().trim_matches('"').trim_matches('\'').to_string();
                if !d.is_empty() {
                    description = Some(d);
                }
            }
        }

        let name = name
            .filter(|n| !n.is_empty())
            .unwrap_or_else(|| "Untitled".to_string());
        Some((name, description, instructions))
    }

    fn slugify(name: &str) -> String {
        name.to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-")
    }

    fn write_agent_file(
        path: &std::path::Path,
        name: &str,
        description: &Option<String>,
        instructions: &str,
    ) -> Result<(), String> {
        let mut content = String::from("---\n");
        content.push_str(&format!("name: {}\n", name));
        if let Some(desc) = description {
            content.push_str(&format!("description: {}\n", desc));
        }
        content.push_str("---\n\n");
        content.push_str(instructions);
        content.push('\n');

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        std::fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
    }

    pub fn list(&self) -> Vec<AgentConfig> {
        self.configs.lock().unwrap().clone()
    }

    pub fn get(&self, id: &str) -> Option<AgentConfig> {
        let configs = self.configs.lock().unwrap();
        configs.iter().find(|c| c.id == id).cloned()
    }

    pub fn create(&self, req: CreateAgentConfigRequest) -> Result<AgentConfig, String> {
        let slug = Self::slugify(&req.name);
        if slug.is_empty() {
            return Err("Name must contain at least one alphanumeric character".to_string());
        }

        let file_path = self.agents_dir.join(format!("{}.md", slug));
        if file_path.exists() {
            return Err(format!("Agent config '{}' already exists", slug));
        }

        Self::write_agent_file(&file_path, &req.name, &req.description, &req.instructions)?;

        let config = Self::parse_agent_file(&file_path)
            .ok_or_else(|| "Failed to parse newly created agent config".to_string())?;

        let mut configs = self.configs.lock().unwrap();
        configs.push(config.clone());
        configs.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(config)
    }

    fn validate_in_agents_dir(
        agents_dir: &std::path::Path,
        file_path: &std::path::Path,
    ) -> Result<(), String> {
        let canonical_file = file_path
            .canonicalize()
            .unwrap_or_else(|_| file_path.to_path_buf());
        let canonical_agents = agents_dir
            .canonicalize()
            .unwrap_or_else(|_| agents_dir.to_path_buf());
        if !canonical_file.starts_with(&canonical_agents) {
            return Err("Invalid agent config id".to_string());
        }
        Ok(())
    }

    pub fn update(&self, id: &str, req: UpdateAgentConfigRequest) -> Result<AgentConfig, String> {
        let mut configs = self.configs.lock().unwrap();
        let existing = configs
            .iter()
            .find(|c| c.id == id)
            .ok_or_else(|| format!("Agent config '{}' not found", id))?
            .clone();

        let name = req.name.unwrap_or(existing.name);
        let description = match req.description {
            Some(desc) => Some(desc),
            None => existing.description,
        };
        let instructions = req.instructions.unwrap_or(existing.instructions);

        let file_path = PathBuf::from(&existing.file_path);
        Self::validate_in_agents_dir(&self.agents_dir, &file_path)?;
        Self::write_agent_file(&file_path, &name, &description, &instructions)?;

        let updated = Self::parse_agent_file(&file_path)
            .ok_or_else(|| "Failed to parse updated agent config".to_string())?;

        if let Some(pos) = configs.iter().position(|c| c.id == id) {
            configs[pos] = updated.clone();
        }

        Ok(updated)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let mut configs = self.configs.lock().unwrap();
        let existing = configs
            .iter()
            .find(|c| c.id == id)
            .ok_or_else(|| format!("Agent config '{}' not found", id))?;

        let file_path = PathBuf::from(&existing.file_path);
        Self::validate_in_agents_dir(&self.agents_dir, &file_path)?;
        std::fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;

        configs.retain(|c| c.id != id);
        Ok(())
    }

    pub fn refresh(&self) -> Vec<AgentConfig> {
        let configs = Self::scan_directory(&self.agents_dir);
        let mut store = self.configs.lock().unwrap();
        *store = configs.clone();
        configs
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_frontmatter_with_name_and_description() {
        let content = "---\nname: Scout\ndescription: A research agent\n---\n\nInstructions here";
        let (name, desc, instructions) = AgentConfigStore::parse_frontmatter(content).unwrap();
        assert_eq!(name, "Scout");
        assert_eq!(desc, Some("A research agent".to_string()));
        assert_eq!(instructions, "Instructions here");
    }

    #[test]
    fn parse_frontmatter_without_frontmatter() {
        let content = "# My Agent\n\nSome instructions";
        let (name, desc, instructions) = AgentConfigStore::parse_frontmatter(content).unwrap();
        assert_eq!(name, "My Agent");
        assert!(desc.is_none());
        assert_eq!(instructions, content);
    }

    #[test]
    fn slugify_basic() {
        assert_eq!(AgentConfigStore::slugify("My Agent Name"), "my-agent-name");
        assert_eq!(AgentConfigStore::slugify("Scout"), "scout");
        assert_eq!(
            AgentConfigStore::slugify("Hello World! 123"),
            "hello-world-123"
        );
    }
}
