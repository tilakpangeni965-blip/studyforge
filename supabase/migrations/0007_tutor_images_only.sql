-- Voice input is paused while the tutor uses the DeepSeek hosted API.
-- Keep existing audio attachments readable, but allow new uploads only for images.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'tutor-attachments';
