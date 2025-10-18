import React, { useState } from 'react';
import { makeStyles, Button, Input, Text, tokens } from '@fluentui/react-components';
import { getPostState } from '../api';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center',
  },
  input: {
    marginBottom: tokens.spacingVerticalM,
    width: '100%',
    height: '40px',
    fontSize: '16px',
  },
  button: {
    marginBottom: tokens.spacingVerticalM,
    display: 'block',
    width: '100%',
  },
  status: {
    marginTop: tokens.spacingVerticalM,
    fontWeight: 'bold',
  },
});

const statusStyles: Record<string, { color: string }> = {
    Approved: { color: tokens.colorPaletteGreenForeground1 },
    Pending: { color: tokens.colorPaletteYellowForeground1 },
    Rejected: { color: tokens.colorPaletteRedForeground1 },
    'Deleted or Not Found': { color: tokens.colorNeutralForeground3 },
  };

const PostState: React.FC = () => {
  const styles = useStyles();
  const [id, setId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPostState = async () => {
    try {
      setError(null);
      const result = await getPostState(id);
      setStatus(result.status);
    } catch (err) {
      setError('获取投稿状态失败，请检查ID是否正确');
    }
  };

  return (
    <div className={styles.container}>
      <Input
        className={styles.input}
        placeholder="输入投稿ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <Button className={styles.button} appearance="primary" onClick={fetchPostState} disabled={!id}>
        查询状态
      </Button>
      {status && (
        <Text className={styles.status} style={statusStyles[status] || {}}>
          投稿状态：{status === 'Approved' ? '通过' : status === 'Pending' ? '待审核' : status === 'Rejected' ? '拒绝' : '不存在'}
        </Text>
      )}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </div>
  );
};

export default PostState;