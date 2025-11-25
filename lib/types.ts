export interface VaultConfig {
  url: string;
  token: string;
  namespace?: string;
}

export interface SavedConfig {
  id: string;
  name: string;
  url: string;
  token: string;
  namespaces: string[];
}

export interface Secret {
  path: string;
  data: Record<string, unknown>;
  metadata?: {
    created_time: string;
    deletion_time: string;
    destroyed: boolean;
    version: number;
  };
}

export interface SecretListItem {
  name: string;
  path: string;
  isFolder: boolean;
}

export interface VaultError {
  message: string;
  errors?: string[];
}
