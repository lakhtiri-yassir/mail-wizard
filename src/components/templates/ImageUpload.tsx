/**
 * ============================================================================
 * Image Upload Component
 * ============================================================================
 *
 * Purpose: Upload and manage images for email templates
 *
 * Features:
 * - Drag and drop file upload
 * - Gallery view of uploaded images
 * - Image selection for templates
 * - Delete uploaded images
 * - Automatic CDN URL generation
 * - Storage in Supabase Storage bucket
 *
 * Props:
 * - onSelectImage: Callback when image is selected
 * - selectedUrl?: Currently selected image URL
 *
 * Design System Compliance:
 * - Uses Button component
 * - Uses brand colors (gold, purple)
 * - Proper loading and error states
 *
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface MediaItem {
  id: string;
  filename: string;
  public_url: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
}

interface ImageUploadProps {
  onSelectImage: (url: string) => void;
  selectedUrl?: string;
}

export default function ImageUpload({ onSelectImage, selectedUrl }: ImageUploadProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's images on mount
  useEffect(() => {
    loadImages();
  }, []);

  /**
   * Loads user's uploaded images from database
   */
  async function loadImages() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setImages(data || []);
    } catch (error: any) {
      console.error('Failed to load images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles file upload
   */
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('media_library')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media_library')
        .getPublicUrl(filePath);

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Save to database
      const { data: mediaItem, error: dbError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          filename: file.name,
          storage_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions.width,
          height: dimensions.height
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to images list
      setImages(prev => [mediaItem, ...prev]);
      toast.success('Image uploaded successfully');

      // Auto-select the uploaded image
      onSelectImage(publicUrl);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  /**
   * Gets image dimensions
   */
  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };

      img.src = url;
    });
  }

  /**
   * Handles image deletion
   */
  async function handleDelete(image: MediaItem) {
    if (!confirm('Delete this image? This cannot be undone.')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media_library')
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      // Remove from list
      setImages(prev => prev.filter(img => img.id !== image.id));
      toast.success('Image deleted');

      // Deselect if this was selected
      if (selectedUrl === image.public_url) {
        onSelectImage('');
      }

    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  }

  /**
   * Drag and drop handlers
   */
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  /**
   * Formats file size for display
   */
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-gold bg-gold/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-gold animate-spin" />
            <p className="text-sm text-gray-600">Uploading image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">
                Drag and drop an image here, or
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG, GIF, or WebP (max 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No images uploaded yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload your first image to get started
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedUrl === image.public_url
                    ? 'border-gold shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectImage(image.public_url)}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={image.public_url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Selected Indicator */}
                {selectedUrl === image.public_url && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <p className="text-white text-xs font-medium px-2 text-center truncate w-full">
                    {image.filename}
                  </p>
                  <p className="text-white/80 text-xs">
                    {image.width && image.height
                      ? `${image.width} × ${image.height}`
                      : formatFileSize(image.file_size)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image);
                    }}
                    className="mt-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
