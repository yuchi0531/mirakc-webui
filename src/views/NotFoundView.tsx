import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export function NotFoundView() {
  const navigate = useNavigate();
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
      <EmptyState title="ページが見つかりません" description="URL を確認してください。" />
      <Button variant="outlined" onClick={() => navigate('/')}>
        ホームへ戻る
      </Button>
    </Stack>
  );
}
