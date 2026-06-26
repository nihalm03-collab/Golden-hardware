export function friendlyError(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong";

  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    if (msg.includes("sku")) return "This SKU already exists. Use a different SKU.";
    if (msg.includes("bill_number")) return "Bill number conflict. Please try again.";
    if (msg.includes("date")) return "A ledger entry already exists for this date.";
    return "This record already exists.";
  }
  if (msg.includes("violates not-null") || msg.includes("null value"))
    return "Please fill in all required fields.";
  if (msg.includes("violates foreign key"))
    return "This item is linked to other records and cannot be removed.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Connection problem. Check your internet and try again.";
  if (msg.includes("JWT") || msg.includes("auth"))
    return "Session expired. Please refresh the page.";
  if (msg.includes("row-level security") || msg.includes("policy"))
    return "Permission denied. Contact your administrator.";
  if (msg.includes("too many requests") || msg.includes("rate limit"))
    return "Too many requests. Please wait a moment and try again.";

  return "Something went wrong. Please try again.";
}
