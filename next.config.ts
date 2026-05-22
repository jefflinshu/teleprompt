import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env into process.env (dotenv.populate is used internally to inject)
dotenv.config({ path: '.env', override: true });

let projectId = '';
// Try to read project_id from .project in the root directory and inject into env
try {
  const projectPath = path.join(process.cwd(), '.project');
  const raw = fs.readFileSync(projectPath, 'utf8');
  const data = JSON.parse(raw) as {
    project_id?: string;
  };

  // Reuse dotenv.populate to inject .project contents into process.env
  projectId = data?.project_id ?? '';
} catch {
  // Silently ignore if .project is missing or fails to parse, for compatibility
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PROJECT_ID: projectId,
  },
  serverExternalPackages: [],
  allowedDevOrigins: ['*.sandbox.ppio.cn', '*.sandbox.novita.ai'],
};

export default nextConfig;

