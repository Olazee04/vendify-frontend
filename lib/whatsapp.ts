export function toWaNumber(raw: string): string {
  let n = (raw || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "234" + n.slice(1);
  else if (!n.startsWith("234") && n.length === 10) n = "234" + n;
  return n;
}

export function buildPaidMessage(o: {
  storeName: string;
  orderNumber?: string;
  reference: string;
  amount: number;
  isStockpile: boolean;
  items?: { name: string; qty: number }[];
}) {
  const lines = [
    `Hello ${o.storeName}, I have just paid on your store.`,
    "",
    o.isStockpile ? "Type: Stockpile (ship later)" : "Type: Delivery order",
  ];
  if (o.orderNumber) lines.push(`Order number: ${o.orderNumber}`);
  lines.push(`Payment reference: ${o.reference}`);
  lines.push(`Amount: ₦${o.amount.toLocaleString("en-NG")}`);
  if (o.items?.length) {
    lines.push("Items:");
    o.items.forEach((i) => lines.push(`- ${i.name} x${i.qty}`));
  }
  lines.push("", "Please confirm my payment. Thank you!");
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;
}