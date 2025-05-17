import React, { useState, useCallback } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface HiringExtractorProps {
  apiEndpoint: string;
}

//okay heres how the frontend immigration verification platform should work, it sends the document whether its a pdf or picture to the backend, and the backend returns data in json format that the frontend should display in the frontend, the json tag with key "prompt" should be displayed by the backend status bar, so refactor the code to make it do that

const HiringExtractor: React.FC<HiringExtractorProps> = ({ apiEndpoint }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // TODO: Replace with actual API call
      // const response = await axios.post(apiEndpoint, formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadStatus({
        success: true,
        message: 'File uploaded successfully!',
      });
    } catch (error) {
      setUploadStatus({
        success: false,
        message: 'Error uploading file. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  }, [apiEndpoint]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Hiring Extractor
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload a job description or resume to extract key hiring information.
      </Typography>
      
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the file here' : 'Drag and drop a file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: PDF, JPG, PNG (Max 10MB)
        </Typography>
      </Paper>

      {isUploading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Processing your file...
          </Typography>
        </Box>
      )}

      {uploadStatus && (
        <Paper
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: uploadStatus.success ? 'success.light' : 'error.light',
            color: 'white',
          }}
        >
          <Typography>{uploadStatus.message}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default HiringExtractor;
