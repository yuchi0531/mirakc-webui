import { Route, Routes } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Nav } from './components/Nav';
import { HomeView } from './views/HomeView';
import { EPGView } from './views/EPGView';
import { ProgramView } from './views/ProgramView';
import { SearchView } from './views/SearchView';
import { AboutView } from './views/AboutView';
import { NotFoundView } from './views/NotFoundView';

export default function App() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Nav />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/epg" element={<EPGView />} />
          <Route path="/epg/services/:globalServiceId" element={<EPGView />} />
          <Route path="/epg/programs/:programId" element={<ProgramView />} />
          <Route path="/epg/search" element={<SearchView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Container>
    </Box>
  );
}
