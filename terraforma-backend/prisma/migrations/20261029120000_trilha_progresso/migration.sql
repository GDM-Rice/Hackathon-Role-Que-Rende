-- Progresso da trilha de cada usuário (antes só no localStorage do aparelho).

-- CreateTable
CREATE TABLE "trilha_progresso" (
    "user_id" TEXT NOT NULL,
    "capitulo" INTEGER NOT NULL,
    "indice" INTEGER NOT NULL,
    "concluida_em" TIMESTAMP(3) NOT NULL,
    "acertos" INTEGER,
    "total" INTEGER,
    "escolha" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trilha_progresso_pkey" PRIMARY KEY ("user_id","capitulo","indice")
);

-- AddForeignKey
ALTER TABLE "trilha_progresso" ADD CONSTRAINT "trilha_progresso_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
