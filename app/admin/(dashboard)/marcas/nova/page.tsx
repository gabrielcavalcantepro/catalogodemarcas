import { BrandForm } from "../brand-form";
import { createBrand } from "../actions";

export default function NovaMarcaPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-heading-md text-paper">Nova marca</h1>
      <div className="mt-6">
        <BrandForm action={createBrand} />
      </div>
    </div>
  );
}
