import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeStyles, tokens, Card, CardHeader, CardPreview, Text, Input, Button, Field, Textarea, Title2 } from '@fluentui/react-components';
import { initBackend } from '../api';
import type { InitPayload } from '../api';
import { toast } from 'react-toastify';

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalXL,
  },
  card: {
    width: 'min(720px, 92vw)',
    borderRadius: tokens.borderRadiusLarge,
  },
  content: {
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: '96px',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    maxWidth: '640px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
});

const InitPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [adminToken, setAdminToken] = useState('');
  const [uploadFolder, setUploadFolder] = useState('img');
  const [allowedExtensions, setAllowedExtensions] = useState('png,jpg,jpeg,gif,webp');
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(10); // 以MB为单位，默认10MB
  const [bannedKeywords, setBannedKeywords] = useState('');
  const [initializing, setInitializing] = useState(false);

  const onInit = async () => {
    setInitializing(true);
    try {
      const payload: InitPayload = {
        adminToken,
        uploadFolder,
        allowedExtensions: allowedExtensions
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        maxFileSize: Math.round(Number(maxFileSizeMB) * 1024 * 1024),
        bannedKeywords: bannedKeywords
          ? bannedKeywords.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
      };

      const res = await initBackend(payload);
      if (res.status === 'OK') {
        toast.success('初始化成功');
        navigate('/');
      } else {
        toast.error(res.reason || '初始化失败');
      }
    } catch (err: any) {
      toast.error(err?.message || '初始化失败');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader header={<Title2> 😉 初始化后端</Title2>} />
        <CardPreview>
          <div className={styles.content}>
            <Text weight="semibold">🎊 恭喜！只差最后一步，即可开始使用！ 为保证安全，后续需通过config.py修改配置</Text>
            <Field label="管理员令牌">
              <Input value={adminToken} onChange={(_, v) => setAdminToken(v?.value || '')} placeholder="请输入管理员令牌" />
            </Field>
            <Field label="上传目录">
              <Input value={uploadFolder} onChange={(_, v) => setUploadFolder(v?.value || '')} placeholder="例如：img" />
            </Field>
            <Field label="允许扩展名 (逗号分隔)">
              <Input value={allowedExtensions} onChange={(_, v) => setAllowedExtensions(v?.value || '')} placeholder="png,jpg,jpeg,gif,webp" />
            </Field>
            <Field label="最大文件大小 (MB)">
              <Input
                type="number"
                value={String(maxFileSizeMB)}
                onChange={(_, v) => setMaxFileSizeMB(Number(v?.value || maxFileSizeMB))}
                placeholder="例如：10"
              />
            </Field>
            <Field label="违禁词 (可选，逗号分隔)">
              <Textarea value={bannedKeywords} onChange={(_, v) => setBannedKeywords(v?.value || '')} resize="vertical" placeholder="例如：spam,广告,违禁词" />
            </Field>

            <Button style={{ marginTop: tokens.spacingVerticalXL }} appearance="primary" onClick={onInit} disabled={initializing}>
              {initializing ? '正在初始化...' : '开始初始化'}
            </Button>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default InitPage;