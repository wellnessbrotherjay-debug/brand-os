"use client";

export type AutomationTemplate = {
  id: string;
  name: string;
  category: "onboarding" | "retention" | "concierge";
};

const MOCK_TEMPLATES: AutomationTemplate[] = [
  { id: "welcome", name: "Welcome to Hotel Fit", category: "onboarding" },
  { id: "scan-reminder", name: "Body Scan Reminder", category: "retention" },
  { id: "concierge-update", name: "Post Workout Concierge Update", category: "concierge" },
];

export function listAutomationTemplates() {
  return MOCK_TEMPLATES;
}

export async function sendTemplatePreview(params: { templateId: string; to: string }) {
  console.info("Postmark template preview", params);
  return { messageId: `mock-${Date.now()}` };
}
