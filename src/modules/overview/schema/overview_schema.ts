import { z } from "zod";

export const overviewStatusSchema = z.object({
  request_id: z.string().min(1),
  checked_at: z.string().datetime(),
  environment: z.enum(["development", "production"]),
  auth_mode: z.enum(["development_fixture", "local_login"]),
  session_state: z.enum(["present", "missing"]),
  database_state: z.enum(["configured", "not_configured"]),
  sister_mode: z.enum(["fixture", "live"]),
  sister_configuration: z.enum(["ready", "incomplete"]),
});

export const overviewIntegrationSchema = z.object({
  configured: z.boolean(),
  registered: z.boolean(),
  enabled: z.boolean(),
  expected_role: z.string().nullable(),
  last_health_at: z.string().datetime().nullable(),
  database_available: z.boolean(),
});

export type OverviewStatus = z.infer<typeof overviewStatusSchema>;
export type OverviewIntegration = z.infer<typeof overviewIntegrationSchema>;

export const overviewSessionSchema = z.object({
  role: z.enum(["ADMIN", "OPERATOR", "REVIEWER", "VIEWER"]),
});

export type OverviewSession = z.infer<typeof overviewSessionSchema>;
