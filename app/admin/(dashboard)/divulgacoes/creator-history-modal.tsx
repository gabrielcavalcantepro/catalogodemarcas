import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteContentPost } from "./actions";

type Post = {
  id: string;
  contentType: string;
  postDate: Date;
  link: string | null;
  product: { name: string } | null;
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Vídeo",
  LIVE: "Live",
  STORY: "Story",
};

// Histórico é sempre escopado a UMA criadora (nunca a lista global de
// antes) — posts já vêm filtrados do server component pai, sem query nova.
export function CreatorHistoryModal({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <p className="text-sm text-mist">Nenhuma divulgação registrada ainda.</p>;
  }

  return (
    <ul className="max-h-96 space-y-2 overflow-y-auto">
      {posts.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-[10px] border border-graphite px-3 py-2.5 text-sm"
        >
          <div className="min-w-0">
            <p className="text-paper">
              {CONTENT_TYPE_LABELS[p.contentType] ?? p.contentType}
              {p.product && <span className="text-mist"> · {p.product.name}</span>}
            </p>
            <p className="font-mono text-xs text-mist">
              {p.postDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Abrir
              </a>
            )}
            <form action={deleteContentPost}>
              <input type="hidden" name="contentPostId" value={p.id} />
              <ConfirmSubmitButton className="px-2" aria-label="Excluir" confirmMessage="Excluir esta divulgação?" />
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
