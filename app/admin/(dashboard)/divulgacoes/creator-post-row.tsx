"use client";

import { useState } from "react";
import { ExternalLink, Video, Radio } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import { RegisterPostForm } from "./register-post-form";
import { CreatorHistoryModal } from "./creator-history-modal";

type Delivery = { id: string; status: "IN_TRANSIT" | "RECEIVED"; product: { id: string; name: string } };
type Post = {
  id: string;
  contentType: string;
  postDate: Date;
  link: string | null;
  product: { name: string } | null;
};
type Creator = { id: string; name: string | null; tiktokHandle: string };

const STATUS_LABELS: Record<Delivery["status"], string> = {
  IN_TRANSIT: "Em trânsito",
  RECEIVED: "Recebida",
};

export function CreatorPostRow({
  creator,
  brandId,
  deliveries,
  posts,
}: {
  creator: Creator;
  brandId: string;
  deliveries: Delivery[];
  posts: Post[];
}) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const videoCount = posts.filter((p) => p.contentType === "VIDEO").length;
  const liveCount = posts.filter((p) => p.contentType === "LIVE").length;
  const receivedProducts = deliveries.filter((d) => d.status === "RECEIVED").map((d) => d.product);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-paper">{creator.name ?? "(aguardando registro)"}</p>
          <a
            href={`https://www.tiktok.com/@${creator.tiktokHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-gold transition-colors duration-150 hover:underline"
          >
            @{creator.tiktokHandle}
            <ExternalLink size={13} strokeWidth={1.75} />
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm text-mist">
          <span className="flex items-center gap-1.5" title="Vídeos">
            <Video size={15} strokeWidth={1.75} />
            {videoCount}
          </span>
          <span className="flex items-center gap-1.5" title="Lives">
            <Radio size={15} strokeWidth={1.75} />
            {liveCount}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {deliveries.map((d) => (
          <span
            key={d.id}
            className={
              d.status === "RECEIVED"
                ? "rounded-full border border-emerald-500/40 px-2.5 py-1 text-xs text-emerald-400"
                : "rounded-full border border-orange-400/40 px-2.5 py-1 text-xs text-orange-400"
            }
          >
            {d.product.name} · {STATUS_LABELS[d.status]}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setRegisterOpen(true)}>
          Registrar divulgação
        </Button>
        <Button type="button" variant="ghost" onClick={() => setHistoryOpen(true)}>
          Histórico ({posts.length})
        </Button>
      </div>

      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title={`Registrar divulgação — @${creator.tiktokHandle}`}
      >
        <RegisterPostForm
          creatorId={creator.id}
          brandId={brandId}
          receivedProducts={receivedProducts}
          onSuccess={() => setRegisterOpen(false)}
        />
      </Modal>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Histórico — @${creator.tiktokHandle}`}
        maxWidth="max-w-xl"
      >
        <CreatorHistoryModal posts={posts} />
      </Modal>
    </Card>
  );
}
