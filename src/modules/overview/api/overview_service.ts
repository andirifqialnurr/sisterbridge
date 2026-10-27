import { z } from "zod";

import { findOverviewIntegration } from "../repository/overview_repository";

const integrationIdSchema = z.string().uuid();

export async function getSisterIntegrationStatus() {
  const integrationId = integrationIdSchema.safeParse(process.env.SISTER_INTEGRATION_ID);
  if (!integrationId.success) {
    return { configured: false, registered: false, enabled: false, expected_role: null, last_health_at: null, database_available: Boolean(process.env.DATABASE_URL?.trim()) };
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return { configured: true, registered: false, enabled: false, expected_role: null, last_health_at: null, database_available: false };
  }
  try {
    const record = await findOverviewIntegration(integrationId.data);
    return {
      configured: true,
      registered: Boolean(record),
      enabled: record?.isEnabled ?? false,
      expected_role: record?.expectedRole ?? null,
      last_health_at: record?.lastHealthAt?.toISOString() ?? null,
      database_available: true,
    };
  } catch {
    return { configured: true, registered: false, enabled: false, expected_role: null, last_health_at: null, database_available: false };
  }
}
