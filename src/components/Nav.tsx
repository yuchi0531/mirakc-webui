import { useCallback, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import type { StatusIconKey } from '../state/AppState';
import { useAppState } from '../state/AppState';
import { useThemeMode } from '../themeMode';

const STATUS_LABEL: Record<StatusIconKey, string> = {
  normal: '待機中',
  active: '稼働中',
  offline: '切断',
};

const STATUS_COLOR: Record<StatusIconKey, string> = {
  normal: 'success.main',
  active: 'primary.main',
  offline: 'error.main',
};

function ConnectionStatus() {
  const { statusIconKey } = useAppState();
  return (
    <Tooltip title={`接続状態: ${STATUS_LABEL[statusIconKey]}`}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: STATUS_COLOR[statusIconKey],
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    navigate(`/epg/search?q=${encodeURIComponent(q)}`);
  }, [navigate, query]);

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Enter') submit();
  };

  return (
    <TextField
      size="small"
      placeholder="番組検索..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
      variant="outlined"
      sx={{
        width: { xs: 140, sm: 220 },
        '& .MuiInputBase-root': { bgcolor: 'background.paper' },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title="検索">
              <IconButton size="small" edge="end" onClick={submit} aria-label="検索">
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );
}

function CogMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { mode, toggle } = useThemeMode();
  const navigate = useNavigate();

  const close = () => setAnchor(null);

  return (
    <>
      <Tooltip title="メニュー">
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} aria-label="メニュー">
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            toggle();
            close();
          }}
        >
          <ListItemIcon>
            {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{mode === 'dark' ? 'ライトテーマ' : 'ダークテーマ'}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            navigate('/about');
            close();
          }}
        >
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>mirakc WebUI について</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open('/api/debug', '_blank', 'noopener');
            close();
          }}
        >
          <ListItemIcon>
            <MenuBookIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>API Docs</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { version } = useAppState();

  const onEpg = location.pathname.startsWith('/epg');

  return (
    <AppBar position="sticky" color="default" enableColorOnDark elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
          <ConnectionStatus />
          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
            sx={{ display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}
          >
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700, lineHeight: 1 }}>
              mirakc
            </Typography>
            <Typography component="sup" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {version?.current ?? '..'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <SearchBox />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="ホーム">
            <IconButton color={location.pathname === '/' ? 'primary' : 'inherit'} onClick={() => navigate('/')}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="EPG 番組表">
            <IconButton color={onEpg ? 'primary' : 'inherit'} onClick={() => navigate('/epg')}>
              <CalendarMonthIcon />
            </IconButton>
          </Tooltip>
          <CogMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
