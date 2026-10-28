import { Transform } from 'class-transformer';

// "  Ana@Email.COM " -> "ana@email.com". Evita contas duplicadas e login que falha por causa de maiúscula.
export const NormalizeEmail = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
