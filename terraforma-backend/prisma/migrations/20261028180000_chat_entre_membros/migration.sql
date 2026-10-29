-- Chat deixa de ter um dono único e passa a ter membros.
-- Os dados existentes são preservados: o antigo dono vira membro e autor das mensagens USER.

-- CreateTable
CREATE TABLE "chat_membros" (
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_membros_pkey" PRIMARY KEY ("chat_id","user_id")
);

INSERT INTO "chat_membros" ("chat_id", "user_id", "created_at")
SELECT "id", "user_id", "created_at" FROM "chats";

-- AlterTable messages: autor e marcação de moderação
ALTER TABLE "messages" ADD COLUMN "autor_id" TEXT,
ADD COLUMN "moderada" BOOLEAN NOT NULL DEFAULT false;

UPDATE "messages" AS m SET "autor_id" = c."user_id"
FROM "chats" AS c
WHERE m."chat_id" = c."id" AND m."role" = 'USER';

ALTER TABLE "messages" DROP COLUMN "role";

-- DropEnum
DROP TYPE "MessageRole";

-- AlterTable chats: remove o dono único
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_fkey";
DROP INDEX "chats_user_id_updated_at_idx";
ALTER TABLE "chats" DROP COLUMN "user_id";

-- CreateIndex
CREATE INDEX "chats_updated_at_idx" ON "chats"("updated_at");
CREATE INDEX "chat_membros_user_id_idx" ON "chat_membros"("user_id");
CREATE INDEX "messages_autor_id_idx" ON "messages"("autor_id");

-- AddForeignKey
ALTER TABLE "chat_membros" ADD CONSTRAINT "chat_membros_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_membros" ADD CONSTRAINT "chat_membros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
