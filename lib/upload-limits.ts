// Compartilhado entre lib/storage.ts (checagem por arquivo), as actions de
// Marcas/Produtos (checagem da soma de todos os arquivos de um envio) e os
// formulários client-side (feedback antes mesmo de enviar). Não é só o
// limite "razoável" pra uma foto — é o teto real que uma Server Action
// consegue receber: a Vercel impõe 4.5MB de infraestrutura pra Serverless
// Functions (não configurável), e next.config.ts define bodySizeLimit como
// 4mb pra ficar com folga abaixo disso. 3.5MB deixa margem extra pro
// overhead do multipart/form-data e os outros campos de texto do form.
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "3,5MB";
