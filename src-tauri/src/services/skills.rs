use crate::types::skills::{CreateSkillRequest, Skill};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct SkillStore {
    skills: Mutex<Vec<Skill>>,
    skills_dir: PathBuf,
}

impl SkillStore {
    pub fn new() -> Self {
        let skills_dir = dirs::home_dir()
            .expect("home dir")
            .join(".goose")
            .join("skills");
        let skills = Self::scan_directory(&skills_dir);
        Self {
            skills: Mutex::new(skills),
            skills_dir,
        }
    }

    fn scan_directory(dir: &PathBuf) -> Vec<Skill> {
        let mut skills = Vec::new();
        let entries = match std::fs::read_dir(dir) {
            Ok(entries) => entries,
            Err(_) => return skills,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_file = path.join("SKILL.md");
                if skill_file.exists() {
                    if let Some(skill) = Self::parse_skill_file(&skill_file) {
                        skills.push(skill);
                    }
                }
            }
        }

        skills.sort_by(|a, b| a.name.cmp(&b.name));
        skills
    }

    fn parse_skill_file(path: &std::path::Path) -> Option<Skill> {
        let content = std::fs::read_to_string(path).ok()?;
        let (name, description, instructions) = Self::parse_frontmatter(&content)?;

        let dir_name = path.parent()?.file_name()?.to_string_lossy().to_string();

        Some(Skill {
            id: format!("skill-{}", dir_name),
            name,
            description,
            source: "user".to_string(),
            path: path.to_string_lossy().to_string(),
            content: instructions,
        })
    }

    fn parse_frontmatter(content: &str) -> Option<(String, String, String)> {
        let trimmed = content.trim();
        if !trimmed.starts_with("---") {
            return None;
        }

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
                description = Some(val.trim().trim_matches('"').trim_matches('\'').to_string());
            }
        }

        Some((
            name.unwrap_or_default(),
            description.unwrap_or_default(),
            instructions,
        ))
    }

    fn build_skill_md(name: &str, description: &str, instructions: &str) -> String {
        format!(
            "---\nname: {}\ndescription: \"{}\"\n---\n\n{}",
            name,
            description.replace('"', "\\\""),
            instructions
        )
    }

    pub fn list(&self) -> Vec<Skill> {
        self.skills.lock().unwrap().clone()
    }

    #[allow(dead_code)]
    pub fn get(&self, id: &str) -> Option<Skill> {
        let skills = self.skills.lock().unwrap();
        skills.iter().find(|s| s.id == id).cloned()
    }

    pub fn create(&self, req: CreateSkillRequest) -> Result<Skill, String> {
        let name = req.name.trim().to_string();
        if name.is_empty() {
            return Err("Skill name is required".to_string());
        }

        // Validate kebab-case
        let re = regex::Regex::new(r"^[a-z0-9]+(-[a-z0-9]+)*$").unwrap();
        if !re.is_match(&name) {
            return Err("Skill name must be kebab-case (e.g. 'my-skill')".to_string());
        }

        let skill_dir = self.skills_dir.join(&name);
        if skill_dir.exists() {
            return Err(format!("Skill '{}' already exists", name));
        }

        std::fs::create_dir_all(&skill_dir)
            .map_err(|e| format!("Failed to create skill directory: {}", e))?;

        let skill_file = skill_dir.join("SKILL.md");
        let content = Self::build_skill_md(&name, &req.description, &req.instructions);

        std::fs::write(&skill_file, &content)
            .map_err(|e| format!("Failed to write SKILL.md: {}", e))?;

        let skill = Skill {
            id: format!("skill-{}", name),
            name: name.clone(),
            description: req.description,
            source: "user".to_string(),
            path: skill_file.to_string_lossy().to_string(),
            content: req.instructions,
        };

        let mut skills = self.skills.lock().unwrap();
        skills.push(skill.clone());
        skills.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(skill)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        // Strip the "skill-" prefix to get the directory name
        let dir_name = id.strip_prefix("skill-").unwrap_or(id);

        // Validate dir_name is safe kebab-case (no path separators or traversal)
        let re = regex::Regex::new(r"^[a-z0-9]+(-[a-z0-9]+)*$").unwrap();
        if !re.is_match(dir_name) {
            return Err("Invalid skill id".to_string());
        }

        let skill_dir = self.skills_dir.join(dir_name);

        // Confirm the resolved path stays inside skills_dir
        let canonical_skill_dir = skill_dir
            .canonicalize()
            .unwrap_or_else(|_| skill_dir.clone());
        let canonical_skills_dir = self
            .skills_dir
            .canonicalize()
            .unwrap_or_else(|_| self.skills_dir.clone());
        if !canonical_skill_dir.starts_with(&canonical_skills_dir) {
            return Err("Invalid skill id".to_string());
        }

        if skill_dir.exists() {
            std::fs::remove_dir_all(&skill_dir)
                .map_err(|e| format!("Failed to delete skill: {}", e))?;
        }

        let mut skills = self.skills.lock().unwrap();
        skills.retain(|s| s.id != id);
        Ok(())
    }

    pub fn refresh(&self) -> Vec<Skill> {
        let skills = Self::scan_directory(&self.skills_dir);
        let mut store = self.skills.lock().unwrap();
        *store = skills.clone();
        skills
    }
}
