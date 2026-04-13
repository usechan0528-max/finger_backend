CREATE TABLE "notifications" (
  "id" BIGSERIAL PRIMARY KEY,
  "recipient_user_id" BIGINT NOT NULL,
  "actor_user_id" BIGINT,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(100) NOT NULL,
  "body" VARCHAR(255) NOT NULL,
  "link_path" VARCHAR(255),
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP(3),
  CONSTRAINT "notifications_recipient_user_id_fkey"
    FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notifications_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "notifications_recipient_user_id_created_at_idx"
  ON "notifications"("recipient_user_id", "created_at" DESC);

CREATE INDEX "notifications_recipient_user_id_is_read_idx"
  ON "notifications"("recipient_user_id", "is_read");
