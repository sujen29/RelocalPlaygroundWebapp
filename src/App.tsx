import React, { useState } from 'react';
import { 
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './components/Sidebar';
import DocumentVerifier from './components/DocumentVerifier';
import StatusBox from './components/StatusBox';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Immigration Verification Platform
            </Typography>
          </Toolbar>
        </AppBar>

        <Sidebar
          open={isSidebarOpen}
          onToggle={handleSidebarToggle}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${240}px)` },
            marginTop: '64px',
          }}
        >
          <DocumentVerifier apiEndpoint="http://localhost:8000/api/upload" />
        </Box>
        <StatusBox apiEndpoint="http://localhost:8000/api" />
      </Box>
    </ThemeProvider>
  );
}

export default App;
