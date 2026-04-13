ALTER TABLE post_comments
ADD COLUMN parent_comment_id BIGINT NULL;

ALTER TABLE post_comments
ADD CONSTRAINT fk_post_comments_parent
FOREIGN KEY (parent_comment_id) REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX idx_post_comments_parent_comment_id
ON post_comments(parent_comment_id);
