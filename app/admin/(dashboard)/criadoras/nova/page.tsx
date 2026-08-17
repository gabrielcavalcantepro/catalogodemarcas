import { CreatorForm } from "../creator-form";
import { createCreator } from "../actions";

export default function NovaCriadoraPage() {
  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Nova criadora</h1>
      <div className="mt-6">
        <CreatorForm action={createCreator} />
      </div>
    </div>
  );
}
