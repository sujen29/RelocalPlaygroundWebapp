import React, { useEffect, useState, useCallback } from 'react';
import { 
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface StatusBoxProps {
  apiEndpoint: string;
}

interface StatusMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

const StatusBox: React.FC<StatusBoxProps> = ({ apiEndpoint }) => {
  const [status, setStatus] = useState<string>('Checking...');
  const [messages, setMessages] = useState<StatusMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const theme = useTheme();
  const messageId = React.useRef(0);

  // Function to add a new status message
  const addStatusMessage = useCallback((message: string, type: StatusMessage['type'] = 'info') => {
    const newMessage: StatusMessage = {
      id: messageId.current++,
      message,
      type,
      timestamp: new Date()
    };
    
    setMessages(prev => [newMessage, ...prev].slice(0, 5)); // Keep only the 5 most recent messages
  }, []);

  // Function to clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Get icon based on message type
  const getStatusIcon = (type: StatusMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'warning':
        return <ErrorIcon fontSize="small" color="warning" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  // Get color based on status
  const getStatusColor = () => 'text.secondary';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 300,
        maxHeight: isMinimized ? 40 : 300,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: theme.palette.background.paper,
          borderLeft: `4px solid ${theme.palette[status === 'connected' ? 'success' : 'error'].main}`,
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {status === 'connected' ? (
            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
          ) : (
            <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
          )}
          <Typography variant="subtitle2">
            Backend: <span style={{ color: getStatusColor() }}>{status}</span>
          </Typography>
        </Box>
        <Tooltip title={isMinimized ? 'Show status' : 'Hide status'}>
          <IconButton size="small" onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      <Fade in={!isMinimized}>
        <Paper
          elevation={3}
          sx={{
            mt: 1,
            p: 2,
            overflowY: 'auto',
            maxHeight: 250,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Status Messages
            </Typography>
            {messages.length > 0 && (
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={clearMessages}
              >
                Clear all
              </Typography>
            )}
          </Box>
          
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No status messages
            </Typography>
          ) : (
            <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper,
                    borderLeft: `3px solid ${
                      msg.type === 'success' 
                        ? theme.palette.success.main 
                        : msg.type === 'error'
                        ? theme.palette.error.main
                        : msg.type === 'warning'
                        ? theme.palette.warning.main
                        : theme.palette.info.main
                    }`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ mr: 1, mt: '2px' }}>
                      {getStatusIcon(msg.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {msg.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {msg.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};

export default StatusBox;
