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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Interface for the API response (assuming it's the same as DocumentVerifier)
interface FileData {
  data: Blob | null;
  filename: string;
}

interface ConversionResult {
  success: boolean;
  filename?: string;
  fileType?: string;
  // Keeping the old interface for backward compatibility
  file_type?: string;
  page_count?: number;
  is_valid?: boolean;
  validity_reason?: string | Record<string, any>;
  prompt?: string;
  ai_response?: {
    document_type?: string;
    document_lang?: string;
    has_english_translation?: boolean | null;
    applicant_name?: string;
    document_details?: Record<string, any>;
    is_valid?: boolean;
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
  const [fileData, setFileData] = useState<FileData>({ data: null, filename: '' });
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

  const handleDownload = () => {
    if (!fileData.data) return;
    
    const url = window.URL.createObjectURL(fileData.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileData.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

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
      const response = await axios({
        method: 'POST',
        url: apiEndpoint,
        data: formData,
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'converted-resume.docx'; // Default filename

      // Try to parse filename* (RFC 5987) which handles UTF-8 encoding and URL-encoded characters
      // Regex captures: 1: charset, 2: language, 3: encoded filename
      const rfc5987Match = contentDisposition.match(/filename\*\s*=\s*([^']*)'([^']*)'([^;]+)/i);
      
      if (rfc5987Match && typeof rfc5987Match[3] === 'string') {
        try {
          filename = decodeURIComponent(rfc5987Match[3]);
        } catch (e) {
          console.error('Error decoding RFC 5987 filename:', e, rfc5987Match[3]);
          // Fallback to default if decoding fails catastrophically
        }
      } else {
        // Fallback to simpler filename= (handles quoted and unquoted)
        const simpleFilenameMatch = contentDisposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
        if (simpleFilenameMatch) {
          // Prioritize quoted filename (group 1 of this regex), then unquoted (group 2)
          const matchedName = simpleFilenameMatch[1] || simpleFilenameMatch[2];
          if (typeof matchedName === 'string') {
            filename = matchedName.replace(/^['"\s]+|['"\s]+$/g, ''); // Trim quotes and whitespace
          }
        }
      }

      // Basic sanitization: remove any path components just in case
      filename = filename.split('/').pop()?.split('\\').pop() || filename;
      
      // Store file data for download
      setFileData({
        data: response.data,
        filename: filename
      });
      
      // Update UI state
      setConversionResult({
        success: true,
        filename: filename,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      if (onStatusUpdate) {
        onStatusUpdate('Resume processed successfully. Ready to download.');
      }
      
    } catch (err: any) {
      console.error('Error processing file:', err);
      let errorMessage = 'An error occurred while processing your resume';
      
      // Try to parse error response if it's JSON
      if (err.response?.data) {
        try {
          const errorText = await new Response(err.response.data).text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If not JSON, use default error message
          console.error('Error parsing error response:', e);
        }
      }
      
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
    setFileData({ data: null, filename: '' });
    if (onStatusUpdate) {
      onStatusUpdate('Ready to convert candidate resume');
    }
  };

  const renderConversionResults = () => {
    if (!conversionResult) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Alert
          severity="success"
          icon={<VerifiedIcon />}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Resume Processed Successfully
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your resume has been processed and is ready to download.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudDownloadIcon />}
              onClick={handleDownload}
              disabled={!fileData.data}
              sx={{ mt: 1 }}
            >
              Download Converted Resume
            </Button>
          </Box>
        </Alert>

        {/* Show additional details if available */}
        {conversionResult.ai_response?.document_details && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Document Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {Object.entries(conversionResult.ai_response.document_details).map(([key, value]) => (
                <Box key={key} sx={{ flex: '1 1 300px' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}:
                  </Typography>
                  <Typography variant="body1">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
        
        {/* Toggle for raw JSON response */}
        <Button 
          onClick={() => setShowRawJson(!showRawJson)} 
          variant="text"
          size="small"
          endIcon={showRawJson ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: 'none', mt: 2 }}
        >
          {showRawJson ? 'Hide Debug Information' : 'Show Debug Information'}
        </Button>
        {showRawJson && conversionResult && (
          <Paper elevation={2} sx={{ mt: 1, p: 2, backgroundColor: 'grey.100' }}>
            <Typography variant="subtitle2" gutterBottom>Response Metadata:</Typography>
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
              <CloudUploadIcon sx={{ mr: 1.5, color: 'primary.main' }} />
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