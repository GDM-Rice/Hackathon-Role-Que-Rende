-- Quando a pessoa concluiu as boas-vindas (tutorial de 3 passos). null = ainda não.
ALTER TABLE "users" ADD COLUMN "boas_vindas_em" TIMESTAMP(3);
