"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { ErrorBox } from "@/components/ui";
import { api, type Card } from "@/lib/api";

export default function EditCardPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCard(Number(id))
      .then(setCard)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Editar tarjeta</h1>
      <ErrorBox message={error} />
      {card && <CardForm card={card} />}
    </div>
  );
}
