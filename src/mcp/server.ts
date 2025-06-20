import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateDependencyGraph } from "../index.js";
import { resolve } from "path";

export async function startMcpServer() {
  const server = new McpServer({
    name: "modgraph",
    version: "1.0.0",
  });

  // Register the analyze tool
  server.registerTool(
    "analyze",
    {
      title: "Analyze Dependencies",
      description:
        "Generate a module dependency graph from JavaScript/TypeScript codebase",
      inputSchema: {
        directory: z
          .string()
          .describe("The directory to analyze for dependencies"),
        entryPoints: z
          .array(z.string())
          .optional()
          .describe("Specific entry point files to analyze"),
        tsConfigPath: z
          .string()
          .optional()
          .describe("Path to tsconfig.json for TypeScript path aliases"),
        excludePatterns: z
          .array(z.string())
          .optional()
          .describe("Glob patterns for files/directories to exclude"),
        debug: z
          .boolean()
          .optional()
          .describe("Include additional debug information"),
      },
      outputSchema: {
        rootNodes: z
          .array(z.string())
          .describe("Files with no dependents (entry points)"),
        modules: z
          .record(
            z.string(),
            z.object({
              dependencies: z
                .array(z.string())
                .describe("Files this module imports"),
              dependents: z
                .array(z.string())
                .describe("Files that import this module"),
            })
          )
          .describe(
            "Object mapping file paths to their dependencies and dependents"
          ),
        metadata: z
          .object({
            cwd: z.string().describe("Working directory used for analysis"),
            totalFiles: z
              .number()
              .describe("Number of files in the dependency graph"),
            totalDependencies: z
              .number()
              .describe("Total number of import relationships"),
            generatedAt: z
              .string()
              .describe("ISO timestamp of when the graph was generated"),
          })
          .describe("Additional information about the analysis"),
      },
    },
    async ({
      directory,
      entryPoints,
      tsConfigPath,
      excludePatterns,
      debug,
    }) => {
      // Resolve paths relative to the provided directory
      const resolvedDirectory = resolve(directory);
      const resolvedEntryPoints = entryPoints?.map((ep) =>
        resolve(resolvedDirectory, ep)
      );
      const resolvedTsConfigPath = tsConfigPath
        ? resolve(resolvedDirectory, tsConfigPath)
        : undefined;

      // Generate the dependency graph
      const graph = await generateDependencyGraph({
        directory: resolvedDirectory,
        entryPoints: resolvedEntryPoints,
        tsConfigPath: resolvedTsConfigPath,
        excludePatterns: excludePatterns || [],
        debug: debug || false,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(graph, null, 2),
          },
        ],
        structuredContent: {
          rootNodes: graph.rootNodes,
          modules: graph.modules,
          metadata: graph.metadata,
        },
      };
    }
  );

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}
