"use client";

import { useMemo, useState } from "react";
import { useVenueContext } from "@/lib/venue-context";
import { resolveBrandColors } from "@/lib/workout-engine/brand-colors";
import { sendTemplatePreview, listAutomationTemplates } from "@/lib/integrations/postmark";
import MainLayout from "@/components/MainLayout";
import { NexusCard } from "@/components/ui/NexusCard";
import { NexusButton } from "@/components/ui/NexusButton";

export default function CrmPage() {
  const { activeVenue } = useVenueContext();
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const templates = listAutomationTemplates();

  const brandColors = useMemo(() => resolveBrandColors({ activeVenue }), [activeVenue]);

  const handlePreview = async () => {
    setError(null);
    setStatus(null);
    try {
      const response = await sendTemplatePreview({
        templateId: selectedTemplate,
        to: "hotel-fit-preview@example.com",
      });
      setStatus(`Preview sent via Postmark (message ${response.messageId})`);
    } catch (err: any) {
      setError(err?.message ?? "Unable to send preview");
    }
  };

  return (
    <MainLayout title="Guest Journeys" subtitle="CRM Automation">
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="text-sm text-slate-300">
          Configure Postmark templates for onboarding, reminders, and concierge updates.
        </p>

        <NexusCard className="p-6 space-y-4">
          <label className="text-sm text-slate-200">
            Template
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
              value={selectedTemplate}
              onChange={(event) => setSelectedTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <NexusButton
            onClick={handlePreview}
            className="w-full md:w-auto"
            style={{ backgroundColor: brandColors.accent, color: "#050b12" }}
          >
            Send Test Email
          </NexusButton>
          {status && <p className="text-xs text-slate-400">{status}</p>}
          {error && <p className="text-xs text-amber-300">{error}</p>}
        </NexusCard>
      </div>
    </MainLayout>
  );
}
