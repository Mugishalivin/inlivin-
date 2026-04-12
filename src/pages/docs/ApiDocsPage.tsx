import { DocsLayout } from "@/components/DocsLayout";
import { Code2, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

export function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      method: "GET",
      path: "/content",
      description: "Get your content",
      response: '{\n  "data": [\n    {\n      "id": "123",\n      "title": "My First Post",\n      "type": "video"\n    }\n  ]\n}',
    },
    {
      method: "POST",
      path: "/content",
      description: "Create new content",
      response: '{\n  "id": "124",\n  "status": "processing"\n}',
    },
    {
      method: "GET",
      path: "/analytics/channel",
      description: "Get channel analytics",
      response: '{\n  "views": 15420,\n  "engagement": 8.5,\n  "followers": 450\n}',
    },
    {
      method: "GET",
      path: "/users/:id",
      description: "Get user profile",
      response: '{\n  "id": "user123",\n  "username": "creator",\n  "followers": 1200\n}',
    },
  ];

  return (
    <DocsLayout
      title="API Documentation"
      description="Build powerful integrations with our REST API"
      breadcrumbs={[{ label: "Resources", href: "/docs" }]}
    >
      <div className="space-y-12">
        {/* Authentication */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Authentication</h2>
          <p className="text-muted-foreground mb-6">
            All API requests require authentication using an API key.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Include your API key in the Authorization header:
              </p>
              <div className="bg-muted p-4 rounded-lg relative">
                <code className="text-sm text-foreground font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <button
                  onClick={() =>
                    copyToClipboard("Authorization: Bearer YOUR_API_KEY", "auth")
                  }
                  className="absolute top-2 right-2 p-2 hover:bg-background rounded transition-colors"
                >
                  {copied === "auth" ? (
                    <CheckCircle size={16} className="text-primary" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Base URL:</p>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm text-foreground font-mono">
                  https://api.inlivin.com/v1
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="bg-muted p-4 border-b border-border flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      endpoint.method === "GET"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        : "bg-green-500/20 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-foreground flex-1">{endpoint.path}</code>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                </div>
                <div className="p-4 bg-card">
                  <p className="text-xs font-semibold text-foreground mb-2">Example Response:</p>
                  <div className="bg-muted p-3 rounded text-xs font-mono text-foreground overflow-x-auto relative">
                    <pre>{endpoint.response}</pre>
                    <button
                      onClick={() =>
                        copyToClipboard(endpoint.response, `endpoint-${idx}`)
                      }
                      className="absolute top-2 right-2 p-2 hover:bg-background rounded transition-colors"
                    >
                      {copied === `endpoint-${idx}` ? (
                        <CheckCircle size={16} className="text-primary" />
                      ) : (
                        <Copy size={16} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Code Examples</h2>

          <div className="space-y-6">
            {/* JavaScript */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b border-border flex items-center gap-2">
                <Code2 size={18} className="text-primary" />
                <span className="font-semibold text-foreground">JavaScript</span>
              </div>
              <div className="p-4 bg-[#1e1e1e] overflow-x-auto">
                <pre className="text-sm text-[#d4d4d4] font-mono">
{`const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.inlivin.com/v1',
  headers: {
    'Authorization': \`Bearer \${process.env.API_KEY}\`
  }
});

// Get content
const getContent = async () => {
  const response = await client.get('/content');
  return response.data;
};`}
                </pre>
              </div>
            </div>

            {/* Python */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b border-border flex items-center gap-2">
                <Code2 size={18} className="text-primary" />
                <span className="font-semibold text-foreground">Python</span>
              </div>
              <div className="p-4 bg-[#1e1e1e] overflow-x-auto">
                <pre className="text-sm text-[#d4d4d4] font-mono">
{`import requests

API_KEY = 'your_api_key'
BASE_URL = 'https://api.inlivin.com/v1'

headers = {'Authorization': f'Bearer {API_KEY}'}

# Get content
response = requests.get(f'{BASE_URL}/content', headers=headers)
content = response.json()`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Rate Limits</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { plan: "Starter", limit: "100/day" },
              { plan: "Creator", limit: "1,000/day" },
              { plan: "Pro", limit: "10,000/day" },
              { plan: "Enterprise", limit: "Custom" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-sm font-semibold text-foreground">{item.plan}</p>
                <p className="text-xs text-muted-foreground">{item.limit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
