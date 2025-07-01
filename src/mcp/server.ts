import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateDependencyGraph, getEntryPointsForFiles } from "../index.js";
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
          .describe("The directory to analyze for dependencies (absolute path)"),
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
        includePatterns: z
          .array(z.string())
          .optional()
          .describe("Glob patterns for files to include (if not specified, all supported files are included)"),
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
      includePatterns,
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
        includePatterns: includePatterns || [],
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

  // Register the get_entry_points tool
  server.registerTool(
    "get_entry_points",
    {
      title: "Get Entry Points",
      description:
        "Find entry points that include the specified files in their module dependency trees",
      inputSchema: {
        directory: z
          .string()
          .describe("The directory to analyze for dependencies (absolute path)"),
        filePaths: z
          .array(z.string())
          .describe("List of file paths to find entry points for"),
        tsConfigPath: z
          .string()
          .optional()
          .describe("Path to tsconfig.json for TypeScript path aliases"),
        excludePatterns: z
          .array(z.string())
          .optional()
          .describe("Glob patterns for files/directories to exclude"),
      },
      outputSchema: {
        entryPoints: z
          .array(z.string())
          .describe("Entry points that include the specified files in their dependency trees"),
        metadata: z
          .object({
            analyzedFiles: z
              .array(z.string())
              .describe("Files that were analyzed"),
            totalEntryPoints: z
              .number()
              .describe("Total number of entry points found"),
          })
          .describe("Additional information about the analysis"),
      },
    },
    async ({
      directory,
      filePaths,
      tsConfigPath,
      excludePatterns,
    }) => {
      // Resolve paths relative to the provided directory
      const resolvedDirectory = resolve(directory);
      const resolvedTsConfigPath = tsConfigPath
        ? resolve(resolvedDirectory, tsConfigPath)
        : undefined;

      // Generate the complete dependency graph first
      const graph = await generateDependencyGraph({
        directory: resolvedDirectory,
        tsConfigPath: resolvedTsConfigPath,
        excludePatterns: excludePatterns || [],
        debug: false,
      });

      // Convert file paths to relative paths for consistency with the graph
      const relativeFilePaths = filePaths.map(fp => {
        if (fp.startsWith(resolvedDirectory)) {
          return fp.substring(resolvedDirectory.length + 1).replace(/\\/g, '/');
        }
        return fp.replace(/\\/g, '/');
      });

      // Find entry points for the specified files
      const entryPoints = getEntryPointsForFiles(relativeFilePaths, graph);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              entryPoints,
              metadata: {
                analyzedFiles: relativeFilePaths,
                totalEntryPoints: entryPoints.length,
              }
            }, null, 2),
          },
        ],
        structuredContent: {
          entryPoints,
          metadata: {
            analyzedFiles: relativeFilePaths,
            totalEntryPoints: entryPoints.length,
          },
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
