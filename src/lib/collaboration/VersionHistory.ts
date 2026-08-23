/**
 * VersionHistory
 * 
 * Manages document version snapshots, timeline, and restoration.
 * 
 * Features:
 * - Automated and manual snapshot creation
 * - Version timeline management
 * - Content comparison (diffing infrastructure)
 * - Version restoration (creates a new snapshot from an old one)
 * - Metadata tracking (author, timestamp, reason)
 * 
 * Requirements: 4.7, 4.8
 */

import type { CollaborationEngine } from './CollaborationEngine';

/**
 * Single version snapshot
 */
export interface VersionSnapshot {
  /** Unique version ID */
  id: string;
  /** Document content at this version */
  content: string;
  /** User ID who created this version */
  userId: string;
  /** User name who created this version */
  userName: string;
  /** Creation timestamp */
  timestamp: number;
  /** Optional reason or description for the version */
  reason?: string;
  /** Whether this is a named version (milestone) */
  isMilestone: boolean;
}

/**
 * Version comparison result
 */
export interface VersionDiff {
  /** Original version ID */
  fromId: string;
  /** Target version ID */
  toId: string;
  /** Summary of changes (e.g., added/removed character counts) */
  summary: {
    added: number;
    removed: number;
  };
}

/**
 * VersionHistory class
 */
export class VersionHistory {
  private snapshots: VersionSnapshot[] = [];
  private collaborationEngine: CollaborationEngine | null = null;
  private maxAutoSnapshots = 50;

  constructor(initialSnapshots: VersionSnapshot[] = []) {
    this.snapshots = [...initialSnapshots].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Set collaboration engine for context
   */
  setCollaborationEngine(engine: CollaborationEngine): void {
    this.collaborationEngine = engine;
  }

  /**
   * Create a new version snapshot
   * 
   * @param content - Document content
   * @param userId - User ID
   * @param userName - User Name
   * @param reason - Optional reason
   * @param isMilestone - Whether this is a milestone version
   * @returns Created snapshot
   */
  createSnapshot(
    content: string,
    userId: string,
    userName: string,
    reason?: string,
    isMilestone: boolean = false
  ): VersionSnapshot {
    const snapshot: VersionSnapshot = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      userId,
      userName,
      timestamp: Date.now(),
      reason,
      isMilestone,
    };

    this.snapshots.unshift(snapshot);

    // Prune auto-snapshots if they exceed limit
    if (!isMilestone) {
      this.pruneAutoSnapshots();
    }

    return snapshot;
  }

  /**
   * Get all versions
   */
  getVersions(): VersionSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get a specific version by ID
   */
  getVersion(id: string): VersionSnapshot | undefined {
    return this.snapshots.find(s => s.id === id);
  }

  /**
   * Restore a specific version
   * Note: This creates a NEW snapshot based on the old one to preserve history
   * 
   * @param versionId - ID of the version to restore
   * @param userId - User ID performing the restoration
   * @param userName - User Name performing the restoration
   * @returns The newly created restoration snapshot
   */
  restoreVersion(versionId: string, userId: string, userName: string): VersionSnapshot {
    const original = this.getVersion(versionId);
    if (!original) {
      throw new Error(`Version not found: ${versionId}`);
    }

    return this.createSnapshot(
      original.content,
      userId,
      userName,
      `Restored from version ${original.id} (${new Date(original.timestamp).toLocaleString()})`,
      true // Restoration is always a milestone
    );
  }

  /**
   * Compare two versions
   * 
   * @param fromId - Original version ID
   * @param toId - Target version ID
   */
  compareVersions(fromId: string, toId: string): VersionDiff {
    const from = this.getVersion(fromId);
    const to = this.getVersion(toId);

    if (!from || !to) {
      throw new Error('One or both versions not found');
    }

    // Basic diff logic (placeholders for real diffing)
    // In a real implementation, we would use a proper diffing algorithm
    return {
      fromId,
      toId,
      summary: {
        added: Math.max(0, to.content.length - from.content.length),
        removed: Math.max(0, from.content.length - to.content.length),
      },
    };
  }

  /**
   * Prune non-milestone snapshots
   */
  private pruneAutoSnapshots(): void {
    const autoSnapshots = this.snapshots.filter(s => !s.isMilestone);
    if (autoSnapshots.length > this.maxAutoSnapshots) {
      const toRemove = autoSnapshots.slice(this.maxAutoSnapshots);
      const idsToRemove = new Set(toRemove.map(s => s.id));
      this.snapshots = this.snapshots.filter(s => !idsToRemove.has(s.id));
    }
  }

  /**
   * Set max auto-snapshots limit
   */
  setMaxAutoSnapshots(limit: number): void {
    this.maxAutoSnapshots = limit;
    this.pruneAutoSnapshots();
  }
}
