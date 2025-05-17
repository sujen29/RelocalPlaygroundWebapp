import React from 'react';
import { 
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material';
import ListItem from '@mui/material/ListItem';
import { 
  Description as DocumentIcon,
  Receipt as HiringIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    text: 'Immigration Document Verifier',
    icon: <DocumentIcon />,
    path: '/document-verifier',
  },
  {
    text: 'Hiring Extractor',
    icon: <HiringIcon />,
    path: '/hiring-extractor',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={open}
          onClose={onToggle}
          PaperProps={{
            sx: {
              width: 240,
              backgroundColor: 'background.default',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" component="div">
              <DashboardIcon sx={{ mr: 1 }} />
              Dashboard
            </Typography>
          </Box>
          <List>
            {menuItems.map((item, index) => (
              <ListItemButton
                key={index}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default Sidebar;
