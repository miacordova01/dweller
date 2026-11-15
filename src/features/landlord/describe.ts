import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";
import { formatRent } from "@/lib/listings";
import { formatDay, formatWhen } from "@/lib/time";

export type Approval = NonNullable<FunctionReturnType<typeof api.landlord.approvals>>[number];

export const agentNames: Record<Approval["capability"], string> = {
  leasing: "Leasing agent",
  maintenance: "Maintenance agent",
  rent: "Rent agent",
  discovery: "Discovery agent",
};

export function describe(item: Approval) {
  switch (item.kind) {
    case "bookTour":
      return {
        headline: "Book a tour with " + item.renterName,
        detail: formatWhen(item.scheduledFor) + " · " + item.durationMinutes + " min",
      };
    case "acceptVendorQuote":
      return {
        headline: "Accept " + item.vendorName + "'s " + formatRent(item.quoteCents) + " repair quote",
        detail: "Visit " + formatWhen(item.slot),
      };
    case "sendRentReminder":
      return {
        headline:
          "Remind " + item.tenantName + " that " + formatRent(item.amountCents) + " rent is due" +
          (item.dueDate ? " " + formatDay(item.dueDate) : ""),
        detail: "Sends " + formatWhen(item.sendAt),
      };
    default:
      return { headline: "Run " + item.tool, detail: null };
  }
}
