const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

function resolvePackageRoot(packageName) {
  return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [projectRoot] }));
}

const appReactRoot = resolvePackageRoot("react");
const appReactDomRoot = resolvePackageRoot("react-dom");

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.startsWith("react/")) {
    const reactPath =
      moduleName === "react"
        ? path.join(appReactRoot, "index.js")
        : path.join(appReactRoot, moduleName.replace(/^react\//, ""));

    return context.resolveRequest(context, reactPath, platform);
  }

  if (moduleName === "react-dom" || moduleName.startsWith("react-dom/")) {
    const reactDomPath =
      moduleName === "react-dom"
        ? path.join(appReactDomRoot, "index.js")
        : path.join(appReactDomRoot, moduleName.replace(/^react-dom\//, ""));

    return context.resolveRequest(context, reactDomPath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  react: appReactRoot,
  "react-dom": appReactDomRoot,
};

module.exports = withNativeWind(config, {
  input: "./src/global.css",
  configPath: "./tailwind.config.ts",
});
