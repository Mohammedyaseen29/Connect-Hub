const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
module.exports = function loadTs(file, mocks = {}) {
    const filename = path.resolve(file);
    const module = new Module(filename);
    module.filename = filename;
    module.paths = Module._nodeModulePaths(path.dirname(filename));
    const originalRequire = module.require.bind(module);
    module.require = (name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith("@/")) {
            const target = path.resolve(name.slice(2));
            if (fs.existsSync(target)) return require(target);
            if (fs.existsSync(target + ".ts")) return module.exportsLoader(target + ".ts", mocks);
        }
        return originalRequire(name);
    };
    module.exportsLoader = require("./load-ts.cjs");
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        fileName: filename,
    }).outputText;
    module._compile(source, filename);
    return module.exports;
};
