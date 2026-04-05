// src/types/custom-fields.ts
// Generic typed custom fields for Lead and other platform entities.
// Consumers extend the base type with their own field schema.

/**
 * Extend the Lead type with your own custom field schema.
 *
 * @example
 * ```typescript
 * // Define your custom fields
 * interface MyCRMFields {
 *   dealSize:    number;
 *   industry:    "saas" | "ecom" | "real-estate";
 *   referredBy?: string;
 * }
 *
 * // Use typed Lead throughout your app
 * type MyLead = ErixLead<MyCRMFields>;
 *
 * const lead: MyLead = await sdk.crm.leads.retrieve<MyLead>("...");
 * lead.customFields.dealSize; // ✅ fully typed
 * ```
 */
export interface ErixLead<TCustomFields extends Record<string, unknown> = Record<string, unknown>> {
  _id:          string;
  firstName:    string;
  lastName?:    string;
  phone:        string;
  email?:       string;
  status:       string;
  source?:      string;
  pipelineId?:  string;
  stageId?:     string;
  assignedTo?:  string;
  score?:       number;
  tags?:        string[];
  metadata?:    Record<string, unknown>;
  /** Strongly-typed custom fields for your tenant's schema. */
  customFields: TCustomFields;
  createdAt:    string;
  updatedAt:    string;
}

/**
 * Generic paginated result wrapper.
 */
export interface ErixPaginatedResult<T> {
  data:       T[];
  pagination: {
    total: number;
    page:  number;
    limit: number;
    pages: number;
  };
}

/**
 * Helper to extract the custom fields type from a typed Lead.
 *
 * @example
 * ```typescript
 * type Fields = ExtractCustomFields<MyLead>; // => MyCRMFields
 * ```
 */
export type ExtractCustomFields<T> =
  T extends ErixLead<infer CF> ? CF : never;
