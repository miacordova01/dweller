/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assistant from "../assistant.js";
import type * as detail from "../detail.js";
import type * as discovery from "../discovery.js";
import type * as landlord from "../landlord.js";
import type * as listings from "../listings.js";
import type * as maintenance from "../maintenance.js";
import type * as people from "../people.js";
import type * as saved from "../saved.js";
import type * as seed from "../seed.js";
import type * as time from "../time.js";
import type * as tours from "../tours.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assistant: typeof assistant;
  detail: typeof detail;
  discovery: typeof discovery;
  landlord: typeof landlord;
  listings: typeof listings;
  maintenance: typeof maintenance;
  people: typeof people;
  saved: typeof saved;
  seed: typeof seed;
  time: typeof time;
  tours: typeof tours;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
