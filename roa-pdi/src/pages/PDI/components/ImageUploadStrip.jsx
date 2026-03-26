import { useRef, useState } from 'react';
import {
  Box, IconButton, CircularProgress, Tooltip, Stack,
} from '@mui/material';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon    from '@mui/icons-material/Close';
import { MAX_IMAGES, uploadPDIImage } from '../../../services/imageUpload';
import { addImageToItem, removeImageFromItem } from '../../../services/pdi';
import { deletePDIImage } from '../../../services/imageUpload';

export default function ImageUploadStrip({ pdiId, itemId, images = [], uid, disabled }) {
  const fileRef      = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');

  const canAdd = images.length < MAX_IMAGES && !disabled;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    setUploading(true);
    try {
      const url = await uploadPDIImage(pdiId, itemId, file, setProgress);
      await addImageToItem(pdiId, itemId, url, uid);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleRemove(url) {
    await removeImageFromItem(pdiId, itemId, url, uid);
    await deletePDIImage(url);
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
        {/* Thumbnails */}
        {images.map((url, idx) => (
          <Box
            key={url}
            sx={{
              position: 'relative',
              width: 64, height: 64,
              borderRadius: 1.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={url}
              alt={`Photo ${idx + 1}`}
              onClick={() => window.open(url, '_blank')}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
            />
            {!disabled && (
              <IconButton
                size="small"
                onClick={() => handleRemove(url)}
                sx={{
                  position: 'absolute', top: 2, right: 2,
                  bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.25,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            )}
          </Box>
        ))}

        {/* Upload button */}
        {canAdd && (
          <Tooltip title={uploading ? `Uploading ${progress}%` : 'Add photo'}>
            <Box
              onClick={() => !uploading && fileRef.current?.click()}
              sx={{
                width: 64, height: 64,
                borderRadius: 1.5,
                border: '2px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
                flexShrink: 0,
                '&:hover': !uploading ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {},
              }}
            >
              {uploading ? (
                <CircularProgress size={24} variant="determinate" value={progress} />
              ) : (
                <AddPhotoIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
              )}
            </Box>
          </Tooltip>
        )}
      </Stack>

      {/* Hidden file input — capture="environment" opens camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      {error && (
        <Box sx={{ mt: 0.5, fontSize: 12, color: 'error.main' }}>{error}</Box>
      )}
    </Box>
  );
}
