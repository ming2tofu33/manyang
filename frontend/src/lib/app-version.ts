import packageJson from "../../package.json";

export function getAppVersionLabel(): string {
  return `v${packageJson.version}`;
}
