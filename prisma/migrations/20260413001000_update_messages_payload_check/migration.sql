ALTER TABLE messages
DROP CONSTRAINT IF EXISTS chk_messages_payload_by_type;

ALTER TABLE messages
ADD CONSTRAINT chk_messages_payload_by_type
CHECK (
  (message_type = 'TEXT' AND body IS NOT NULL AND LENGTH(BTRIM(body)) > 0 AND attachment_object_key IS NULL)
  OR
  (message_type = 'IMAGE' AND attachment_object_key IS NOT NULL)
);
