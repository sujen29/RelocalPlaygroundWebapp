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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Interface for the API response (assuming it's the same as DocumentVerifier)
interface ConversionResult {
  success: boolean;
  file_type: string;
  page_count: number;
  is_valid?: boolean;
  validity_reason?: string | Record<string, any>;
  prompt?: string;
  ai_response: {
    document_type: string; // This might be 'resume' or similar
    document_lang: string;
    has_english_translation: boolean | null;
    applicant_name: string;
    document_details: Record<string, any>; // Resume specific details
    is_valid?: boolean; // Or perhaps 'is_parsable'
    validity_reason?: string | Record<string, any>;
  };
}

interface CandidateResumeConverterProps {
  apiEndpoint: string;
  onStatusUpdate?: (status: string) => void; // Optional: if you want to update a global status
}

const CandidateResumeConverter: React.FC<CandidateResumeConverterProps> = ({ apiEndpoint, onStatusUpdate }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [showPromptData, setShowPromptData] = useState<boolean>(false); // If applicable
  const [rawResponse, setRawResponse] = useState<any>(null);

  const formatPromptText = (text: string) => {
    if (!text) return '';
    return text.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('- ')) {
        return (
          <Typography key={i} component="div" sx={{ mt: 1, ml: 2 }}>
            • {paragraph.substring(2)}
          </Typography>
        );
      }
      else if (paragraph.endsWith(':')) {
        return (
          <Typography key={i} variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
            {paragraph}
          </Typography>
        );
      }
      else if (paragraph.startsWith('    ')) {
        return (
          <Box key={i} component="pre" sx={{
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            p: 2,
            borderRadius: 1,
            overflowX: 'auto',
            mt: 1,
            mb: 1
          }}>
            {paragraph.trim()}
          </Box>
        );
      }
      return (
        <Typography key={i} paragraph sx={{ mt: 1, whiteSpace: 'pre-line' }}>
          {paragraph}
        </Typography>
      );
    });
  };

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
    setConversionResult(null);
    setError(null);
    
    if (onStatusUpdate) {
      onStatusUpdate('Uploading resume...');
    }

    try {
      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result: ConversionResult = response.data;
      setRawResponse(result);
      console.log('Full API Response (CandidateResumeConverter):', { rawResponse: response, data: result });
      
      const shouldShowSuccess = result.success || (result.ai_response && Object.keys(result.ai_response).length > 0);
      
      if (!shouldShowSuccess) {
        throw new Error('No valid data received from the server');
      }
      
      setConversionResult(result);
      
      if (onStatusUpdate) {
        const docType = result.ai_response?.document_type || 'resume';
        const statusMessage = result.success 
          ? `Successfully processed ${docType} for ${result.ai_response?.applicant_name || 'applicant'}`
          : `Warning: Resume processing issues (${docType})`;
        onStatusUpdate(statusMessage);
      }
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMessage = err.response?.data?.detail || 'An error occurred while processing your resume';
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setConversionResult(null);
    setError(null);
    if (onStatusUpdate) {
      onStatusUpdate('Ready to convert candidate resume');
    }
  };

  const renderConversionResults = () => {
    if (!conversionResult) return null;

    // Customize this section based on the actual structure of resume conversion results
    return (
      <Box sx={{ mt: 3 }}>
        <Alert
          severity={conversionResult.success ? 'success' : 'warning'}
          icon={conversionResult.success ? <VerifiedIcon /> : <WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {conversionResult.success 
                ? 'Resume Processed Successfully' 
                : conversionResult.ai_response 
                  ? 'Resume Processing Issues' 
                  : 'Error processing resume'}
            </Typography>
            {(conversionResult.validity_reason || conversionResult.ai_response?.validity_reason) && (
              <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(
                  conversionResult.validity_reason || 
                  conversionResult.ai_response?.validity_reason, 
                  null, 
                  2
                )}
              </Box>
            )}
          </Box>
        </Alert>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resume Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Applicant Name:
                </Typography>
                <Typography variant="body1">
                  {conversionResult.ai_response?.applicant_name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Detected Language:
                </Typography>
                <Typography variant="body1">
                  {conversionResult.ai_response?.document_lang || 'N/A'}
                </Typography>
              </Box>
              {/* Add more fields from ai_response.document_details as needed */}
              {Object.entries(conversionResult.ai_response?.document_details || {}).map(([key, value]) => (
                <Box key={key}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
        
        {conversionResult.prompt && (
          <Box sx={{ mb: 3 }}>
            <Button 
              onClick={() => setShowPromptData(!showPromptData)} 
              variant="outlined" 
              size="small"
              endIcon={showPromptData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: 'none', mb: 1 }}
            >
              {showPromptData ? 'Hide Prompt Data' : 'Show Prompt Data'}
            </Button>
            {showPromptData && (
              <Paper elevation={2} sx={{ p: 2, backgroundColor: 'grey.100' }}>
                <Typography variant="h6" gutterBottom>Prompt Data</Typography>
                {formatPromptText(conversionResult.prompt)}
              </Paper>
            )}
          </Box>
        )}

        <Button 
          onClick={() => setShowRawJson(!showRawJson)} 
          variant="outlined" 
          size="small"
          endIcon={showRawJson ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: 'none' }}
        >
          {showRawJson ? 'Hide Raw JSON Response' : 'Show Raw JSON Response'}
        </Button>
        {showRawJson && conversionResult && (
          <Paper elevation={2} sx={{ mt: 1, p: 2, backgroundColor: 'grey.100' }}>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace'}}>
              {JSON.stringify(conversionResult.ai_response, null, 2)}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      sx={{
        p: 3, 
        borderRadius: 2, 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 2}}>
        Convert Candidate Resume
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!selectedFile ? (
        <Box 
          {...getRootProps()} 
          sx={{
            border: `2px dashed ${isDragActive ? 'primary.main' : 'grey.400'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'transparent',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
            },
            mb: 3
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.600', mb: 2 }} />
          <Typography variant="h6">
            {isDragActive ? 'Drop the resume here ...' : 'Drag \'n\' drop a resume here, or click to select file'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (PDF, DOCX, DOC, TXT files, max 10MB)
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: 'grey.50'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="body1">{selectedFile.name}</Typography>
            </Box>
            <Button variant="outlined" color="error" onClick={handleRemoveFile} size="small">
              Remove
            </Button>
          </Paper>
        </Box>
      )}

      {isUploading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1 }}>Processing resume...</Typography>
        </Box>
      )}

      {renderConversionResults()}

    </Paper>
  );
};

export default CandidateResumeConverter; 