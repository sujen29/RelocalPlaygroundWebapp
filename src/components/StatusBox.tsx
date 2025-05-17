import React, { useEffect, useState } from 'react';
import { 
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import axios from 'axios';

interface StatusBoxProps {
  apiEndpoint: string;
}

const StatusBox: React.FC<StatusBoxProps> = ({ apiEndpoint }) => {
  const [status, setStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${apiEndpoint}/status`);
        setStatus(response.data.status || 'Unknown');
      } catch (err) {
        setError('Failed to fetch status');
        setStatus('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        boxShadow: 2,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Backend Status
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      ) : (
        <Typography variant="body1" color={status === 'healthy' ? 'success.main' : 'error.main'}>
          {status}
        </Typography>
      )}
    </Paper>
  );
};

export default StatusBox;
