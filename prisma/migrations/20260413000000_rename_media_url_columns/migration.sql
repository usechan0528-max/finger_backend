ALTER TABLE post_media_assets
RENAME COLUMN media_url TO media_object_key;

ALTER TABLE story_media_assets
RENAME COLUMN media_url TO media_object_key;

ALTER TABLE messages
RENAME COLUMN attachment_url TO attachment_object_key;
