import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Input,
  Text,
  Card,
  CardHeader,
  CardPreview,
  tokens,
  Spinner,
  Field,
} from '@fluentui/react-components';
import { LockClosed24Regular, Shield24Regular, ShieldLock24Regular} from '@fluentui/react-icons';
import { verifyAdminPassword } from '../admin_api';
import { toast } from 'react-hot-toast';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXL,
  },
  loginCard: {
    width: '400px',
    maxWidth: '90vw',
    padding: tokens.spacingVerticalXL,
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  passwordField: {
    width: '100%',
  },
  passwordIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  passwordIcon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  loginButton: {
    width: '100%',
    marginTop: tokens.spacingVerticalS,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const styles = useStyles();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      toast.error('请输入管理员密码');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAdminPassword(password);
      
      if (result.success) {
        toast.success(result.message || '登录成功');
        onLoginSuccess();
      } else {
        toast.error(result.message || '登录失败');
        setPassword(''); // 清空密码输入
      }
    } catch (error) {
      toast.error('登录过程中发生错误');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.iconContainer}>
            <Shield24Regular className={styles.icon} />
          </div>
          <Text className={styles.title}>管理员登录</Text>
          <Text className={styles.subtitle}>请输入管理员密码以访问后台</Text>
        </CardHeader>

        <CardPreview>
          <div className={styles.form}>
            <div className={styles.passwordIconContainer}>
              <ShieldLock24Regular className={styles.passwordIcon} />
            </div>
            <Field
              label="管理员密码"
              required
              className={styles.passwordField}
            >
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入管理员密码"
                disabled={loading}
                contentBefore={<LockClosed24Regular />}
              />
            </Field>

            <Button
              appearance="primary"
              size="large"
              className={styles.loginButton}
              onClick={handleLogin}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="tiny" />
                  <Text>登录中...</Text>
                </div>
              ) : (
                '登录'
              )}
            </Button>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default AdminLogin;