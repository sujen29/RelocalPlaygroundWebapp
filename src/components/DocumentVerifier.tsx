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

interface VerificationResult {
  success: boolean;
  file_type: string;
  page_count: number;
  is_valid?: boolean;
  validity_reason?: string | Record<string, any>;
  prompt?: string;
  ai_response: {
    document_type: string;
    document_lang: string;
    has_english_translation: boolean | null;
    applicant_name: string;
    document_details: Record<string, any>;
    is_valid?: boolean;
    validity_reason?: string | Record<string, any>;

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
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [showPromptData, setShowPromptData] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showResponseFields, setShowResponseFields] = useState<boolean>(false);
  
  // Format the prompt text with proper line breaks and formatting
  const formatPromptText = (text: string) => {
    if (!text) return '';
    
    // Split by double newlines to handle paragraphs
    return text.split('\n\n').map((paragraph, i) => {
      // Handle bullet points
      if (paragraph.startsWith('- ')) {
        return (
          <Typography key={i} component="div" sx={{ mt: 1, ml: 2 }}>
            • {paragraph.substring(2)}
          </Typography>
        );
      }
      // Handle headers (lines ending with :)
      else if (paragraph.endsWith(':')) {
        return (
          <Typography key={i} variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
            {paragraph}
          </Typography>
        );
      }
      // Handle code blocks (lines starting with 4 spaces or tab)
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
      // Regular paragraph
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
      setRawResponse(response.data); // Store the raw response for debugging
      console.log('Full API Response:', {
        rawResponse: response,
        data: result,
        hasValidityReason: 'validity_reason' in result || (result.ai_response && 'validity_reason' in result.ai_response),
        keys: Object.keys(result),
        aiResponseKeys: result.ai_response ? Object.keys(result.ai_response) : []
      });
      
      // If we have data but success is false, we'll still show the data but with a warning
      const shouldShowSuccess = result.success || 
                             (result.ai_response && Object.keys(result.ai_response).length > 0);
      
      if (!shouldShowSuccess) {
        throw new Error('No valid data received from the server');
      }
      
      // If we get here, we have data to show
      setVerificationResult(result);
      console.log('Verification Result:', result);
      
      if (onStatusUpdate) {
        const docType = result.ai_response?.document_type || 'document';
        const statusMessage = result.success 
          ? `Successfully processed ${docType} for ${result.ai_response?.applicant_name || 'applicant'}`
          : `Warning: Document is not valid (${docType})`;
        
        // Include the full prompt JSON in the status message for debugging
        const promptInfo = result.prompt ? 
          `\n\nPrompt JSON:\n${JSON.stringify(result.prompt, null, 2)}` : 
          '';
          
        onStatusUpdate(statusMessage + promptInfo);
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
          severity={verificationResult.success ? 'success' : 'warning'}
          icon={verificationResult.success ? <VerifiedIcon /> : <WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {verificationResult.success 
                ? 'Valid Document' 
                : verificationResult.ai_response 
                  ? 'Document is not valid' 
                  : 'Error processing document'}
            </Typography>
            {(verificationResult.validity_reason || verificationResult.ai_response?.validity_reason) && (
              <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(
                  verificationResult.validity_reason || 
                  verificationResult.ai_response?.validity_reason, 
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
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Document Valid:
                </Typography>
                <Typography variant="body1">
                  {verificationResult.ai_response?.is_valid !== undefined ? 
                    (verificationResult.ai_response.is_valid ? 'Yes' : 'No') : 'N/A'}
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
                {Object.entries(verificationResult.ai_response.document_details).map(([key, value]) => {
                  // Handle nested objects by converting them to JSON strings
                  const displayValue = (() => {
                    if (value === null || value === undefined) return 'N/A';
                    if (typeof value === 'object' && value !== null) {
                      try {
                        // If it's an object with a message property, show that
                        if ('message' in value) return value.message;
                        // Otherwise, stringify the object with proper formatting
                        return JSON.stringify(value, null, 2);
                      } catch (e) {
                        return 'Invalid data';
                      }
                    }
                    return String(value);
                  })();

                  return (
                    <Box key={key}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: typeof displayValue === 'string' && 
                                     (displayValue.includes('{') || displayValue.includes('[')) 
                                    ? 'monospace' 
                                    : 'inherit',
                          fontSize: typeof displayValue === 'string' && 
                                   displayValue.length > 100 
                                 ? '0.8rem' 
                                 : 'inherit'
                        }}
                      >
                        {displayValue}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}
        
        {verificationResult?.prompt && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Box 
                onClick={() => setShowPromptData(!showPromptData)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                  mb: showPromptData ? 2 : 0
                }}
              >
                {showPromptData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                <Typography variant="h6" ml={1}>
                  Prompt
                </Typography>
              </Box>
              {showPromptData && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    maxHeight: '500px',
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& pre': {
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      p: 2,
                      borderRadius: 1,
                      overflowX: 'auto',
                      mt: 1,
                      mb: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    },
                    '& code': {
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      p: 0.5,
                      borderRadius: 0.5,
                      fontSize: '0.9em',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    },
                    '& h4': {
                      mt: 3,
                      mb: 1,
                      color: 'primary.main',
                      fontWeight: 'bold',
                      fontSize: '1.1em'
                    },
                    '& ul': {
                      pl: 3,
                      mb: 2
                    },
                    '& li': {
                      mb: 1
                    }
                  }}
                >
                  <Box sx={{
                    '& p': {
                      margin: '0.5em 0',
                      lineHeight: 1.6
                    },
                    '& pre': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '0.5em',
                      borderRadius: '4px',
                      overflowX: 'auto',
                      margin: '0.5em 0'
                    },
                    '& code': {
                      fontFamily: 'monospace',
                      fontSize: '0.9em',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '0.2em 0.4em',
                      borderRadius: '3px'
                    },
                    '& h4': {
                      margin: '1em 0 0.5em 0',
                      fontWeight: 600
                    },
                    '& ul, & ol': {
                      margin: '0.5em 0',
                      paddingLeft: '1.5em'
                    },
                    '& li': {
                      margin: '0.25em 0'
                    },
                    '& strong': {
                      fontWeight: 600
                    },
                    '& em': {
                      fontStyle: 'italic'
                    }
                  }}>
                    {formatPromptText(typeof verificationResult.prompt === 'string' 
                      ? verificationResult.prompt 
                      : JSON.stringify(verificationResult.prompt, null, 2))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {verificationResult && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Box 
                onClick={() => setShowRawJson(!showRawJson)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {showRawJson ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                <Typography variant="h6" ml={1}>
                  Raw AI Response (Debug)
                </Typography>
              </Box>
              {showRawJson && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    maxHeight: '400px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {JSON.stringify(
                    rawResponse?.ai_response || { error: 'No AI response data available' },
                    (key, value) => {
                      // Handle circular references
                      if (value instanceof File) return '[File]';
                      if (value instanceof Blob) return '[Blob]';
                      if (value === '') return '(empty string)';
                      return value;
                    },
                    2
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {verificationResult && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Box 
                onClick={() => setShowResponseFields(!showResponseFields)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {showResponseFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                <Typography variant="h6" ml={1}>
                  Response Fields (Debug)
                </Typography>
              </Box>
              {showResponseFields && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    maxHeight: '400px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {JSON.stringify(
                    (() => {
                      const { ai_response, ...rest } = verificationResult;
                      return rest;
                    })(),
                    null,
                    2
                  )}
                </Box>
              )}
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
