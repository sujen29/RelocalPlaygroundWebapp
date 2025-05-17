import React, { useState } from 'react';
import { 
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface DocumentVerifierProps {
  apiEndpoint: string;
}

const DocumentVerifier: React.FC<DocumentVerifierProps> = ({ apiEndpoint }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const theme = useTheme();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess('Document uploaded successfully!');
    } catch (error) {
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Immigration Document Verifier
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          {...getRootProps()}
          sx={{
            border: 2,
            borderColor: 'primary.main',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': {
              borderColor: theme.palette.primary.dark,
            },
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography variant="h6">Drop the files here...</Typography>
          ) : (
            <>
              <Typography variant="h6">Drag & drop a document here, or click to select files</Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: PDF, PNG, JPG, JPEG, GIF
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {file && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            Selected file: {file.name}
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        sx={{ mb: 3 }}
      >
        {uploading ? <CircularProgress size={24} /> : 'Upload Document'}
      </Button>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {uploadSuccess}
        </Alert>
      )}
    </Box>
  );
};

export default DocumentVerifier;
