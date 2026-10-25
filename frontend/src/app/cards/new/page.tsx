"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CardForm } from "@/components/CardForm";

export default function NewCardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva tarjeta</h1>
      <Suspense>
        <NewCardForm />
      </Suspense>
    </div>
  );
}

function NewCardForm() {
  const topic = useSearchParams().get("topic");
  return <CardForm defaultTopicId={topic ? Number(topic) : undefined} />;
}
