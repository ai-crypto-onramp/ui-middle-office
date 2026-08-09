/// <reference types="vite/client" />

export type AppConfig = {
  identityAuthUrl: string;
  onboardingKycUrl: string;
  amlKytUrl: string;
  policyEngineUrl: string;
  fraudUrl: string;
  auditUrl: string;
  otelEndpoint: string;
  sentryDsn: string;
};

export function loadConfig(env: Record<string, string | undefined> = import.meta.env): AppConfig {
  return {
    identityAuthUrl: env.VITE_IDENTITY_AUTH_URL ?? "http://identity-auth.internal:8080",
    onboardingKycUrl: env.VITE_ONBOARDING_KYC_URL ?? "http://onboarding-kyc.internal:8080",
    amlKytUrl: env.VITE_AML_KYT_URL ?? "http://aml-kyt-screening.internal:8080",
    policyEngineUrl: env.VITE_POLICY_ENGINE_URL ?? "http://policy-risk-engine.internal:8080",
    fraudUrl: env.VITE_FRAUD_URL ?? "http://fraud-detection.internal:8080",
    auditUrl: env.VITE_AUDIT_URL ?? "http://audit-event-log.internal:8080",
    otelEndpoint: env.VITE_OTEL_ENDPOINT ?? "",
    sentryDsn: env.VITE_SENTRY_DSN ?? "",
  };
}