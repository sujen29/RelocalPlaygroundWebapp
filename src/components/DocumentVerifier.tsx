import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  Button,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';

interface VerificationResult {
  success: boolean;
  file_type: string;
  page_count: number;
  ai_response: {
    document_type: string;
    document_lang: string;
    has_english_translation: boolean | null;
    applicant_name: string;
    document_details: Record<string, any>;
  };
}

interface DocumentVerifierProps {
  apiEndpoint: string;
  onStatusUpdate?: (status: string) => void;
}

const DocumentVerifier: React.FC<DocumentVerifierProps> = ({ apiEndpoint, onStatusUpdate }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setSelectedFile(file);
    await handleUpload(file);
  }, [apiEndpoint, onStatusUpdate]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setVerificationResult(null);
    setError(null);
    
    if (onStatusUpdate) {
      onStatusUpdate('Uploading document...');
    }

    try {
      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result: VerificationResult = response.data;
      setVerificationResult(result);
      
      if (onStatusUpdate) {
        const docType = result.ai_response?.document_type || 'document';
        onStatusUpdate(`Successfully processed ${docType} for ${result.ai_response?.applicant_name || 'applicant'}`);
      }
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMessage = err.response?.data?.detail || 'An error occurred while processing your document';
      setError(errorMessage);
      
      if (onStatusUpdate) {
        onStatusUpdate(`Error: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setVerificationResult(null);
    setError(null);
    if (onStatusUpdate) {
      onStatusUpdate('Ready to verify documents');
    }
  };

  // Render the verification results
  const renderVerificationResults = () => {
    if (!verificationResult) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Alert
          severity={verificationResult.success ? 'success' : 'error'}
          icon={verificationResult.success ? <VerifiedIcon /> : <WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            {verificationResult.success ? 'Document processed successfully' : 'Error processing document'}
          </Typography>
        </Alert>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Document Type:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.ai_response?.document_type || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Language:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.ai_response?.document_lang || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Applicant Name:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.ai_response?.applicant_name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  File Type:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.file_type?.toUpperCase() || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Page Count:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.page_count || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {verificationResult.ai_response?.document_details && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {Object.entries(verificationResult.ai_response.document_details).map(([key, value]) => (
                  <Box key={key}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}:
                    </Typography>
                    <Typography variant="body1">
                      {value === null || value === undefined ? 'N/A' : String(value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Immigration Document Verifier
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your immigration documents to verify their authenticity. We support PDF, JPG, and PNG files up to 10MB.
      </Typography>

      {isUploading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Processing your document...
          </Typography>
        </Box>
      ) : !selectedFile ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 6,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              mb: 2, 
              color: isDragActive ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s ease-in-out',
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the file here' : 'Drag and drop a file here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: PDF, JPG, PNG (Max 10MB)
          </Typography>
        </Paper>
      ) : (
        <Paper
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DescriptionIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1">
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              Remove
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {verificationResult ? (
            renderVerificationResults()
          ) : (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Document ready for verification
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleUpload(selectedFile)}
                disabled={isUploading}
                startIcon={<VerifiedIcon />}
              >
                Verify Document
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default DocumentVerifier;
