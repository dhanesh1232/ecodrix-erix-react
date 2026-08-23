/**
 * UserColorManager
 * 
 * Manages color assignment for collaboration users to visually differentiate
 * their cursors and selections.
 * 
 * Features:
 * - Predefined color palette for consistent user identification
 * - Automatic color assignment for new users
 * - Color recycling when users leave
 * - Persistent color mapping per session
 * 
 * Requirements: 4.1
 */

/**
 * Predefined color palette for user cursors and selections
 * Colors are chosen for good contrast and visual distinction
 */
const USER_COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
  '#E76F51', // Coral
  '#2A9D8F', // Dark Teal
  '#E9C46A', // Gold
  '#F4A261', // Sandy Brown
  '#8E44AD', // Dark Purple
  '#3498DB', // Dodger Blue
  '#E74C3C', // Crimson
  '#1ABC9C', // Turquoise
  '#F39C12', // Dark Orange
  '#9B59B6', // Amethyst
];

/**
 * User color assignment interface
 */
export interface UserColorAssignment {
  userId: string;
  color: string;
  assignedAt: number;
}

/**
 * UserColorManager class
 * 
 * Manages color assignment for collaboration users
 */
export class UserColorManager {
  private colorAssignments: Map<string, UserColorAssignment> = new Map();
  private availableColors: Set<string> = new Set(USER_COLOR_PALETTE);
  private colorPalette: string[] = USER_COLOR_PALETTE;

  constructor(customPalette?: string[]) {
    if (customPalette && customPalette.length > 0) {
      this.colorPalette = customPalette;
      this.availableColors = new Set(customPalette);
    }
  }

  /**
   * Assign a color to a user
   * Requirements: 4.1
   * 
   * @param userId - User ID to assign color to
   * @param preferredColor - Optional preferred color (if available)
   * @returns Assigned color
   */
  assignColor(userId: string, preferredColor?: string): string {
    // Check if user already has a color
    const existing = this.colorAssignments.get(userId);
    if (existing) {
      return existing.color;
    }

    let color: string;

    // Try to use preferred color if provided and available
    if (preferredColor && this.availableColors.has(preferredColor)) {
      color = preferredColor;
      this.availableColors.delete(preferredColor);
    } else if (this.availableColors.size > 0) {
      // Assign next available color
      color = Array.from(this.availableColors)[0];
      this.availableColors.delete(color);
    } else {
      // All colors in use, recycle from palette
      const index = this.colorAssignments.size % this.colorPalette.length;
      color = this.colorPalette[index];
    }

    // Store assignment
    const assignment: UserColorAssignment = {
      userId,
      color,
      assignedAt: Date.now(),
    };
    this.colorAssignments.set(userId, assignment);

    return color;
  }

  /**
   * Get color for a user
   * 
   * @param userId - User ID
   * @returns User's color or null if not assigned
   */
  getColor(userId: string): string | null {
    const assignment = this.colorAssignments.get(userId);
    return assignment ? assignment.color : null;
  }

  /**
   * Release a user's color when they leave
   * Requirements: 4.1
   * 
   * @param userId - User ID
   */
  releaseColor(userId: string): void {
    const assignment = this.colorAssignments.get(userId);
    if (assignment) {
      // Return color to available pool
      this.availableColors.add(assignment.color);
      this.colorAssignments.delete(userId);
    }
  }

  /**
   * Get all color assignments
   * 
   * @returns Map of user IDs to color assignments
   */
  getAllAssignments(): Map<string, UserColorAssignment> {
    return new Map(this.colorAssignments);
  }

  /**
   * Get number of assigned colors
   * 
   * @returns Number of users with assigned colors
   */
  getAssignmentCount(): number {
    return this.colorAssignments.size;
  }

  /**
   * Get number of available colors
   * 
   * @returns Number of unassigned colors
   */
  getAvailableColorCount(): number {
    return this.availableColors.size;
  }

  /**
   * Clear all color assignments
   */
  clear(): void {
    this.colorAssignments.clear();
    this.availableColors = new Set(this.colorPalette);
  }

  /**
   * Get the color palette
   * 
   * @returns Array of colors in the palette
   */
  getPalette(): string[] {
    return [...this.colorPalette];
  }

  /**
   * Update the color palette
   * Note: This will clear existing assignments
   * 
   * @param palette - New color palette
   */
  setPalette(palette: string[]): void {
    if (palette.length === 0) {
      throw new Error('Color palette cannot be empty');
    }

    this.colorPalette = palette;
    this.availableColors = new Set(palette);
    this.colorAssignments.clear();
  }

  /**
   * Check if a color is available
   * 
   * @param color - Color to check
   * @returns True if color is available
   */
  isColorAvailable(color: string): boolean {
    return this.availableColors.has(color);
  }

  /**
   * Get assignment for a user
   * 
   * @param userId - User ID
   * @returns User color assignment or null
   */
  getAssignment(userId: string): UserColorAssignment | null {
    return this.colorAssignments.get(userId) || null;
  }
}
