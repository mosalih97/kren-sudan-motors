-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);

-- Create policies for car images
CREATE POLICY "Car images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'car-images');

CREATE POLICY "Authenticated users can upload car images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own car images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own car images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');