// src/demo/index.ts
//
// The single entry point for demo mode. Every integration point in the host app
// imports from "…/demo" and nothing reaches into the files directly, so
// `grep -r "from .*\/demo\"" src` lists every touchpoint the feature has.
//
// See ./README.md for the full list and how to remove or disable the feature.

export {
  DEMO_EVENT_ID,
  isDemoActive,
  isDemoEnabled,
  enterDemo,
  exitDemo,
  clearDemoArtifacts,
} from "./demoMode";

export { installDemoAdapter } from "./demoAdapter";
export { DemoBanner } from "./DemoBanner";
export { DemoGate } from "./DemoGate";
export { default as DemoEntryPage } from "./DemoEntryPage";
export { resetDemoStore } from "./demoStore";
