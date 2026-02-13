import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import { AppConfig, AIProvider, AIModel } from '@/types/workflow';

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'config.yaml');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(fileContents) as AppConfig;
  
  cachedConfig = processEnvSubstitutions(config);
  
  return cachedConfig;
}

function processEnvSubstitutions(config: AppConfig): AppConfig {
  // Process Google Docs OAuth credentials
  if (config.google_docs?.oauth?.client_id) {
    config.google_docs.oauth.client_id = replaceEnvVars(config.google_docs.oauth.client_id as string);
  }
  if (config.google_docs?.oauth?.client_secret) {
    config.google_docs.oauth.client_secret = replaceEnvVars(config.google_docs.oauth.client_secret as string);
  }
  
  // Process AI model IDs with env var substitutions
  if ((config as any).ai_models) {
    const aiModels = (config as any).ai_models;
    for (const key of Object.keys(aiModels)) {
      aiModels[key] = replaceEnvVars(aiModels[key]);
    }
  }
  
  // Process model IDs in AI providers
  if (config.ai_providers?.providers) {
    for (const provider of config.ai_providers.providers) {
      if (provider.models) {
        for (const model of provider.models) {
          model.id = replaceEnvVars(model.id);
        }
      }
    }
  }
  
  return config;
}

function replaceEnvVars(value: string): string {
  // Handle ${VAR:-default} format
  const defaultMatch = value.match(/\$\{(\w+):-([^\}]+)\}/);
  if (defaultMatch) {
    const envName = defaultMatch[1];
    const defaultValue = defaultMatch[2];
    const envValue = process.env[envName];
    return value.replace(defaultMatch[0], envValue || defaultValue);
  }
  
  // Handle ${VAR} format
  return value.replace(/\$\{(\w+)\}/g, (_, envName) => {
    return process.env[envName] || value;
  });
}

export function getAIProviderConfig(config: AppConfig) {
  const providerId = config.ai_providers.active;
  const provider = config.ai_providers.providers.find(p => p.id === providerId);
  return provider || config.ai_providers.providers[0];
}

export function getDefaultModel(config: AppConfig): AIModel | null {
  const provider = getAIProviderConfig(config);
  return provider?.models[0] || null;
}

export function getModelById(config: AppConfig, modelId: string): AIModel | null {
  for (const provider of config.ai_providers.providers) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return model;
  }
  return null;
}

export function getPhaseConfig(config: AppConfig, phase: number) {
  const phaseKey = `phase${phase}`;
  return config.workflow.phases[phaseKey] || null;
}

export function isFeatureEnabled(config: AppConfig, feature: string): boolean {
  return config.features[feature] === true;
}

export function getLanguageOptions(config: AppConfig) {
  return config.app.language.options;
}

export function getActiveLanguage(config: AppConfig): string {
  return config.app.language.default;
}

export function getLanguageInstruction(config: AppConfig, languageCode?: string): string {
  const lang = languageCode || config.app.language.default;
  const instructions = (config as any).app?.language_instructions || {};
  return instructions[lang] || `LANGUAGE: ${lang.toUpperCase()}`;
}
