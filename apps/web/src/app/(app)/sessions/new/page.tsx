import type { Metadata } from "next";
import { SessionSetupWizard } from "@/components/session/SessionSetupWizard";

export const metadata: Metadata = {
  title: "New Session",
};

export default function NewSessionPage() {
  return <SessionSetupWizard />;
}
