import { Step, StepType } from './pages/Builder';

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */
export function parseXml(response: string): Step[] {
  const xmlMatch = response.match(/<boltArtifact[\s\S]*?(?:<\/boltArtifact>|$)/);
  if (!xmlMatch) return [];

  const xmlContent = xmlMatch[0];
  const steps: Step[] = [];
  let stepId = 1;

  const titleMatch = xmlContent.match(/title="([^"]*)"/);
  const artifactTitle = titleMatch?.[1] || "Project Files";

  steps.push({
    id: stepId++,
    title: artifactTitle,
    description: "",
    type: StepType.CreateFolder,
    status: "pending",
  });

  // FIX: first pass — collect only COMPLETE actions (have closing tag)
  const completeRegex =
    /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;

  // FIX: second pass — find the one partial action at the end (no closing tag yet)
  const partialRegex =
    /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)$/;

  const isStreamComplete = xmlContent.includes("</boltArtifact>");

  let match;
  while ((match = completeRegex.exec(xmlContent)) !== null) {
    const [, type, filePath, rawContent] = match;
    const content = rawContent.trim();
    if (!content) continue;

    if (type === "file" && filePath) {
      steps.push({
        id: stepId++,
        title: `Create ${filePath}`,
        description: "",
        type: StepType.CreateFile,
        status: "pending",
        code: content,
        path: filePath,
      });
    } else if (type === "shell") {
      steps.push({
        id: stepId++,
        title: "Run command",
        description: "",
        type: StepType.RunScript,
        status: "pending",
        code: content,
      });
    }
  }

  // FIX: if stream not done yet, also parse the in-progress last action
  if (!isStreamComplete) {
    const partialMatch = xmlContent.match(partialRegex);
    if (partialMatch) {
      const [, type, filePath, rawContent] = partialMatch;
      const content = rawContent.trim();

      // Make sure this partial action isn't already captured as complete
      const alreadyCaptured = steps.some((s) => s.path === filePath);

      if (content && !alreadyCaptured) {
        if (type === "file" && filePath) {
          steps.push({
            id: stepId++,
            title: `Create ${filePath}`,
            description: "",
            type: StepType.CreateFile,
            status: "pending",
            code: content,
            path: filePath,
          });
        } else if (type === "shell") {
          steps.push({
            id: stepId++,
            title: "Run command",
            description: "",
            type: StepType.RunScript,
            status: "pending",
            code: content,
          });
        }
      }
    }
  }

  return steps;
}