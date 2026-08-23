import { describe, it, expect, beforeEach } from "vitest";
import { VersionHistory } from "./VersionHistory";

describe("VersionHistory", () => {
  let versionHistory: VersionHistory;

  beforeEach(() => {
    versionHistory = new VersionHistory();
  });

  it("should create a snapshot", () => {
    const snapshot = versionHistory.createSnapshot(
      "Hello World",
      "u1",
      "User 1",
    );

    expect(snapshot.id).toBeDefined();
    expect(snapshot.content).toBe("Hello World");
    expect(versionHistory.getVersions().length).toBe(1);
  });

  it("should store snapshots in reverse chronological order", async () => {
    versionHistory.createSnapshot("v1", "u1", "User 1");
    // Delay slightly to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));
    versionHistory.createSnapshot("v2", "u1", "User 1");

    const versions = versionHistory.getVersions();
    expect(versions[0].content).toBe("v2");
    expect(versions[1].content).toBe("v1");
  });

  it("should restore a version as a new snapshot", () => {
    const s1 = versionHistory.createSnapshot("Initial Content", "u1", "User 1");
    versionHistory.createSnapshot("Modified Content", "u1", "User 1");

    const restored = versionHistory.restoreVersion(s1.id, "u2", "User 2");

    expect(restored.content).toBe("Initial Content");
    expect(restored.reason).toContain("Restored from version");
    expect(restored.isMilestone).toBe(true);
    expect(versionHistory.getVersions().length).toBe(3);
    expect(versionHistory.getVersions()[0].id).toBe(restored.id);
  });

  it("should prune auto-snapshots but keep milestones", () => {
    versionHistory.setMaxAutoSnapshots(2);

    versionHistory.createSnapshot("v1", "u1", "User 1", "Auto", false);
    versionHistory.createSnapshot("v2", "u1", "User 1", "Auto", false);
    versionHistory.createSnapshot("v3", "u1", "User 1", "Milestone", true);
    versionHistory.createSnapshot("v4", "u1", "User 1", "Auto", false);
    versionHistory.createSnapshot("v5", "u1", "User 1", "Auto", false);

    const versions = versionHistory.getVersions();
    // Should have: v5 (auto), v4 (auto), v3 (milestone). v2 and v1 should be pruned.
    expect(versions.length).toBe(3);
    expect(versions.map((v) => v.content)).toContain("v5");
    expect(versions.map((v) => v.content)).toContain("v4");
    expect(versions.map((v) => v.content)).toContain("v3");
    expect(versions.map((v) => v.content)).not.toContain("v1");
  });

  it("should compare two versions", () => {
    const s1 = versionHistory.createSnapshot("Short", "u1", "User 1");
    const s2 = versionHistory.createSnapshot(
      "Much Longer Content",
      "u1",
      "User 1",
    );

    const diff = versionHistory.compareVersions(s1.id, s2.id);
    expect(diff.summary.added).toBeGreaterThan(0);
  });
});
