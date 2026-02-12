ALTER TABLE capture_pages 
  ADD COLUMN video_url text,
  ADD COLUMN layout_type text DEFAULT 'standard';