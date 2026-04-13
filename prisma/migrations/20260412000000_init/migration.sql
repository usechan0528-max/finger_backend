-- CreateTable users
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "username" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3)
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable profiles
CREATE TABLE "profiles" (
  "user_id" BIGINT PRIMARY KEY,
  "display_name" VARCHAR(50),
  "bio" VARCHAR(255),
  "profile_image_url" TEXT,
  "is_influencer_mode" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable finger_relations
CREATE TABLE "finger_relations" (
  "id" BIGSERIAL PRIMARY KEY,
  "owner_user_id" BIGINT NOT NULL,
  "target_user_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "finger_relations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "finger_relations_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable posts
CREATE TABLE "posts" (
  "id" BIGSERIAL PRIMARY KEY,
  "author_user_id" BIGINT NOT NULL,
  "content_text" TEXT,
  "visibility_type" VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable post_media_assets (original column name before rename migration)
CREATE TABLE "post_media_assets" (
  "id" BIGSERIAL PRIMARY KEY,
  "post_id" BIGINT NOT NULL,
  "media_url" TEXT NOT NULL,
  "media_type" VARCHAR(50) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_media_assets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable stories
CREATE TABLE "stories" (
  "id" BIGSERIAL PRIMARY KEY,
  "author_user_id" BIGINT NOT NULL,
  "content_text" TEXT,
  "visibility_type" VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "stories_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable story_media_assets (original column name before rename migration)
CREATE TABLE "story_media_assets" (
  "id" BIGSERIAL PRIMARY KEY,
  "story_id" BIGINT NOT NULL,
  "media_url" TEXT NOT NULL,
  "media_type" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "story_media_assets_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable message_rooms
CREATE TABLE "message_rooms" (
  "id" BIGSERIAL PRIMARY KEY,
  "user1_id" BIGINT NOT NULL,
  "user2_id" BIGINT NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deactivated_at" TIMESTAMP(3),
  CONSTRAINT "message_rooms_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "message_rooms_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "message_rooms_user1_id_user2_id_key" ON "message_rooms"("user1_id", "user2_id");

-- CreateTable messages (original column name before rename migration)
CREATE TABLE "messages" (
  "id" BIGSERIAL PRIMARY KEY,
  "room_id" BIGINT NOT NULL,
  "sender_user_id" BIGINT NOT NULL,
  "message_type" VARCHAR(50) NOT NULL,
  "body" TEXT,
  "attachment_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "message_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
