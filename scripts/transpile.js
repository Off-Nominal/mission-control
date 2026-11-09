const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const outDir = path.join(root, "dist");

const compilerOptions = {
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
  sourceMap: true,
  downlevelIteration: true,
};

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

function fail(file, diagnostics) {
  for (const diagnostic of diagnostics) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.error(`${file}: ${message}`);
  }
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });

for (const file of walk(srcDir, [])) {
  const source = fs.readFileSync(file, "utf8");
  let result;
  try {
    result = ts.transpileModule(source, {
      compilerOptions,
      fileName: file,
      reportDiagnostics: true,
    });
  } catch (err) {
    console.error(`Failed to transpile ${path.relative(root, file)}`);
    throw err;
  }
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) fail(file, errors);

  const dest = path.join(
    outDir,
    path.relative(srcDir, file).replace(/\.ts$/, ".js"),
  );
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, result.outputText);
  if (result.sourceMapText) {
    fs.writeFileSync(`${dest}.map`, result.sourceMapText);
  }
}
