CREATE TABLE "post_comments" (
  "id" BIGSERIAL NOT NULL,
  "post_id" BIGINT NOT NULL,
  "author_user_id" BIGINT NOT NULL,
  "body" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "post_comments"
ADD CONSTRAINT "post_comments_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_comments"
ADD CONSTRAINT "post_comments_author_user_id_fkey"
FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "post_comments_post_id_created_at_idx"
ON "post_comments"("post_id", "created_at");
