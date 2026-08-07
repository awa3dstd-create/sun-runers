import { db } from "../src/lib/db";

async function main() {
  const recent = await db.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      name: true,
      address: true,
      service: true,
      assignedEngineerId: true,
      assignedZone: true,
      status: true,
      createdAt: true,
    },
  });
  console.log("=== Solicitudes recientes ===");
  console.log(JSON.stringify(recent, null, 2));

  const logs = await db.automationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("\n=== Logs de automatización ===");
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
