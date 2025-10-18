import React from 'react';
import {
  makeStyles,
  Button,
  Text,
  tokens,
  Tab,
  TabList,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import type { TabValue } from '@fluentui/react-components';
import { getAuditMode, setAuditMode, getBackupZip, recoverBackup, getPicLinks, deletePic, type PicLink, getPendingReports, approveReport, rejectReport, type PendingReport, getAdminPostInfo, getPendingPosts, getRejectedPosts, type AdminPostListItem, approvePost, disapprovePost, reauditPost, deletePost } from '../admin_api';
import { Switch } from '@fluentui/react-components';
import { toast } from 'react-hot-toast';
import { 
  SignOut24Regular, 
  WeatherSunny24Regular,
  WeatherMoon24Regular 
} from '@fluentui/react-icons';
import { adminLogout } from '../admin_api';
import { SITE_TITLE } from '../config';

import icon from '/icon.png';
import AdminPostCard from './AdminPostCard';
import AdminModifyPost from './AdminModifyPost';
import AdminManageComments from './AdminManageComments';
import { fetchArticles, type Article } from '../api';

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'hidden',
    height: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '30px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: tokens.spacingHorizontalL,
  },
  title: {
    marginLeft: tokens.spacingHorizontalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    height: '32px',
    width: '32px',
  },
  themeToggle: {
    cursor: 'pointer',
  },
  content: {
    flex: '1 1 auto',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  tabs: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  contentPanel: {
    padding: tokens.spacingHorizontalL,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

interface AdminDashboardProps {
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, 
  isDarkMode = false, 
  onToggleTheme 
}) => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = React.useState<TabValue>('systemSettings');
  const [postReviewSubTab, setPostReviewSubTab] = React.useState<TabValue>('pending');
  const [needAudit, setNeedAudit] = React.useState<boolean | null>(null);
  const [loadingAudit, setLoadingAudit] = React.useState<boolean>(false);
  const [recovering, setRecovering] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = React.useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  // 图片管理状态
  const [picPage, setPicPage] = React.useState<number>(1);
  const [picLoading, setPicLoading] = React.useState<boolean>(false);
  const [picList, setPicList] = React.useState<PicLink[]>([]);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ open: boolean; filename?: string }>({ open: false });
  // 举报管理状态
  const [reportsLoading, setReportsLoading] = React.useState<boolean>(false);
  const [pendingReports, setPendingReports] = React.useState<PendingReport[]>([]);
  const [postContents, setPostContents] = React.useState<Record<number, string>>({});
  // 投稿审核数据状态
  const [approvedArticles, setApprovedArticles] = React.useState<Article[]>([]);
  const [approvedLoading, setApprovedLoading] = React.useState<boolean>(false);
  const [approvedPage, setApprovedPage] = React.useState<number>(1);
  const [approvedHasMore, setApprovedHasMore] = React.useState<boolean>(true);
  const approvedObserver = React.useRef<IntersectionObserver | null>(null);
  const lastApprovedRef = React.useCallback((node: HTMLDivElement | null) => {
    if (approvedLoading) return;
    if (approvedObserver.current) approvedObserver.current.disconnect();
    approvedObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && approvedHasMore) {
        setApprovedPage(prev => prev + 1);
      }
    });
    if (node) approvedObserver.current.observe(node);
  }, [approvedLoading, approvedHasMore]);
  const [pendingPosts, setPendingPosts] = React.useState<AdminPostListItem[]>([]);
  const [pendingPostsLoading, setPendingPostsLoading] = React.useState<boolean>(false);
  const [rejectedPosts, setRejectedPosts] = React.useState<AdminPostListItem[]>([]);
  const [rejectedPostsLoading, setRejectedPostsLoading] = React.useState<boolean>(false);
  // 帖子删除二次确认
  const [deletePostConfirm, setDeletePostConfirm] = React.useState<{ open: boolean; id?: number; list?: 'approved' | 'pending' | 'rejected' }>({ open: false });
  // 修改帖子弹窗
  const [modifyPostModal, setModifyPostModal] = React.useState<{ open: boolean; id?: number; initialContent?: string; list?: 'approved' | 'pending' }>({ open: false });
  // 评论管理弹窗
  const [manageCommentsModal, setManageCommentsModal] = React.useState<{ open: boolean; id?: number }>({ open: false });

  React.useEffect(() => {
    if (activeTab === 'systemSettings') {
      setLoadingAudit(true);
      getAuditMode()
        .then(data => {
          setNeedAudit(!!data.status);
        })
        .catch((err: any) => {
          console.error(err);
          const msg = String(err?.message || '');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else {
            toast.error('获取审核模式失败');
          }
        })
        .finally(() => setLoadingAudit(false));
    } else if (activeTab === 'imageManage') {
      setPicLoading(true);
      getPicLinks(picPage)
        .then(list => setPicList(list))
        .catch((err: any) => {
          console.error(err);
          const msg = String(err?.message || '获取图片链接失败');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else {
            toast.error('获取图片链接失败');
          }
        })
        .finally(() => setPicLoading(false));
    } else if (activeTab === 'complaintReview') {
      setReportsLoading(true);
      getPendingReports()
        .then(list => setPendingReports(list))
        .catch((err: any) => {
          console.error(err);
          const msg = String(err?.message || '获取待处理举报失败');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else {
            toast.error('获取待处理举报失败');
          }
        })
        .finally(() => setReportsLoading(false));
    }
  }, [activeTab, picPage]);

  // 当待处理举报列表更新时，基于 submission_id 拉取帖子内容
  React.useEffect(() => {
    if (activeTab !== 'complaintReview') return;
    const ids = Array.from(new Set(pendingReports.map(r => r.submission_id).filter(id => typeof id === 'number' && id > 0)));
    if (ids.length === 0) return;
    const needFetch = ids.filter(id => !(id in postContents));
    if (needFetch.length === 0) return;
    Promise.all(needFetch.map(id => 
      getAdminPostInfo(id)
        .then(info => ({ id, content: info.content }))
        .catch((e: any) => {
          const msg = String(e?.message || '获取帖子详情失败');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else if (msg.includes('404')) {
            toast.error('帖子不存在');
          } else if (msg.includes('400')) {
            toast.error('缺少帖子 ID');
          } else {
            toast.error('获取帖子详情失败');
          }
          return { id, content: '' };
        })
    )).then(results => {
      setPostContents(prev => {
        const next = { ...prev };
        for (const r of results) {
          next[r.id] = r.content;
        }
        return next;
      });
    });
  }, [activeTab, pendingReports]);

  // 进入“已过审”子选项卡时重置无限滚动状态
  React.useEffect(() => {
    if (activeTab === 'postReview' && postReviewSubTab === 'approved') {
      setApprovedArticles([]);
      setApprovedPage(1);
      setApprovedHasMore(true);
    }
  }, [activeTab, postReviewSubTab]);

  // 投稿审核：根据子选项卡加载对应列表
  React.useEffect(() => {
    if (activeTab !== 'postReview') return;
    if (postReviewSubTab === 'approved') {
      const ac = new AbortController();
      const signal = ac.signal;
      const loadApproved = async () => {
        if (!approvedHasMore) return;
        setApprovedLoading(true);
        try {
          const newArticles = await fetchArticles(approvedPage, signal);
          if (newArticles.length === 0) {
            setApprovedHasMore(false);
          } else {
            setApprovedArticles(prev => [...prev, ...newArticles]);
          }
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error(err);
            toast.error('获取已过审帖子失败');
          }
        } finally {
          setApprovedLoading(false);
        }
      };
      loadApproved();
      return () => ac.abort();
    } else if (postReviewSubTab === 'pending') {
      setPendingPostsLoading(true);
      getPendingPosts()
        .then(list => setPendingPosts(list))
        .catch((err: any) => {
          console.error(err);
          const msg = String(err?.message || '获取待审核帖子失败');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else {
            toast.error('获取待审核帖子失败');
          }
        })
        .finally(() => setPendingPostsLoading(false));
    } else if (postReviewSubTab === 'rejected') {
      setRejectedPostsLoading(true);
      getRejectedPosts()
        .then(list => setRejectedPosts(list))
        .catch((err: any) => {
          console.error(err);
          const msg = String(err?.message || '获取已拒绝帖子失败');
          if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
            toast.error('身份验证失败，请重新登陆');
          } else {
            toast.error('获取已拒绝帖子失败');
          }
        })
        .finally(() => setRejectedPostsLoading(false));
    }
  }, [activeTab, postReviewSubTab, approvedPage]);

  // 确认删除帖子
  const handleConfirmDeletePost = async () => {
    const id = deletePostConfirm.id;
    const list = deletePostConfirm.list;
    if (!id) {
      setDeletePostConfirm({ open: false });
      return;
    }
    try {
      await deletePost(id);
      toast.success(`已删除帖子 #${id}`);
      if (list === 'approved') {
        setApprovedArticles(prev => prev.filter(x => x.id !== id));
      } else if (list === 'pending') {
        setPendingPosts(prev => prev.filter(x => x.id !== id));
      } else if (list === 'rejected') {
        setRejectedPosts(prev => prev.filter(x => x.id !== id));
      }
    } catch (e: any) {
      const msg = String(e?.message || '删除帖子失败');
      toast.error(msg);
    } finally {
      setDeletePostConfirm({ open: false });
    }
  };

  const handleToggleAudit = async (checked: boolean) => {
    try {
      await setAuditMode(checked);
      setNeedAudit(checked);
      toast.success(checked ? '已开启审核模式' : '已关闭审核模式');
    } catch (e: any) {
      const msg = String(e?.message || '切换审核模式失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else {
        toast.error('切换审核模式失败');
      }
    }
  };

  const handleCreateBackup = async () => {
    try {
      const { blob, filename } = await getBackupZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'backup.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('备份已生成并开始下载');
    } catch (e: any) {
      const msg = String(e?.message || '创建备份失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else {
        toast.error('创建备份失败');
      }
    }
  };

  const handleRecoverBackup = async (file: File | null) => {
    if (!file) return;
    setRecovering(true);
    try {
      await recoverBackup(file);
      toast.success('恢复成功');
    } catch (e: any) {
      const msg = String(e?.message || '恢复失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else if (msg.includes('400')) {
        toast.error('请求错误：请检查文件是否为有效 ZIP 备份');
      } else {
        toast.error('服务器错误或恢复失败');
      }
    } finally {
      setRecovering(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedBackupFile(null);
    }
  };

  const handleConfirmRecover = () => {
    if (!selectedBackupFile) return;
    const lower = selectedBackupFile.name.toLowerCase();
    if (!lower.endsWith('.zip')) {
      toast.error('请选择 ZIP 格式的备份文件');
      return;
    }
    setConfirmOpen(false);
    void handleRecoverBackup(selectedBackupFile);
  };

  const handleLogout = () => {
    try {
      adminLogout();
      toast.success('已退出登录');
      onLogout();
    } catch (error) {
      toast.error('退出登录失败');
      console.error('Logout error:', error);
    }
  };

  // 图片删除触发与确认
  const requestDeletePic = (filename: string) => {
    setDeleteConfirm({ open: true, filename });
  };

  // 举报审批操作
  const handleApproveReport = async (id: number) => {
    try {
      await approveReport(id);
      toast.success('已批准举报并删除违规帖子');
      // 刷新列表
      setReportsLoading(true);
      const list = await getPendingReports();
      setPendingReports(list);
    } catch (e: any) {
      const msg = String(e?.message || '批准举报失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else if (msg.includes('404')) {
        toast.error('举报记录不存在或已处理');
      } else if (msg.includes('400')) {
        toast.error('缺少举报 ID');
      } else {
        toast.error('批准举报失败');
      }
    } finally {
      setReportsLoading(false);
    }
  };

  const handleRejectReport = async (id: number) => {
    try {
      await rejectReport(id);
      toast.success('已拒绝举报，帖子保持原状');
      // 刷新列表
      setReportsLoading(true);
      const list = await getPendingReports();
      setPendingReports(list);
    } catch (e: any) {
      const msg = String(e?.message || '拒绝举报失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else if (msg.includes('404')) {
        toast.error('举报记录不存在或已处理');
      } else if (msg.includes('400')) {
        toast.error('缺少举报 ID');
      } else {
        toast.error('拒绝举报失败');
      }
    } finally {
      setReportsLoading(false);
    }
  };

  const handleConfirmDeletePic = async () => {
    const filename = deleteConfirm.filename;
    if (!filename) {
      setDeleteConfirm({ open: false });
      return;
    }
    try {
      await deletePic(filename);
      toast.success('图片已删除');
      // 刷新当前页
      setPicLoading(true);
      const list = await getPicLinks(picPage);
      setPicList(list);
    } catch (e: any) {
      const msg = String(e?.message || '删除图片失败');
      if (msg.includes('401') || msg.includes('403') || msg.includes('登录已过期')) {
        toast.error('身份验证失败，请重新登陆');
      } else if (msg.includes('404')) {
        toast.error('图片不存在或已被删除');
      } else if (msg.includes('400')) {
        toast.error('缺少图片文件名');
      } else {
        toast.error('删除图片失败');
      }
    } finally {
      setDeleteConfirm({ open: false });
      setPicLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* 顶栏 - 采用 MainLayout 的 Header 样式 */}
      <header className={styles.header}>
        <Text size={500} weight="semibold" className={styles.title}>
          <img src={icon} alt="logo" className={styles.icon} />
          {`${SITE_TITLE} | 管理面板`}
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
          {onToggleTheme && (
            <Button 
              appearance="transparent" 
              icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
              onClick={onToggleTheme}
              className={styles.themeToggle}
            />
          )}
          <Button
            appearance="subtle"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <SignOut24Regular />
            退出登录
          </Button>
        </div>
      </header>

      {/* 主内容区域 - 占据剩余空间 */}
      <div className={styles.content}>
        {/* 选项卡 */}
        <div className={styles.tabs}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, data) => setActiveTab(data.value)}
          >
            <Tab value="postReview">投稿审核</Tab>
            <Tab value="complaintReview">投诉审核</Tab>
            <Tab value="imageManage">图片管理</Tab>
            <Tab value="systemSettings">系统设置</Tab>
          </TabList>
        </div>

        {/* 内容面板 */}
        <div className={styles.contentPanel}>
          {activeTab === 'systemSettings' ? (
            <div>
              <Text size={400} weight="semibold">系统设置</Text>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <Text size={300}>新文章是否需要审核</Text>
                <div style={{ marginTop: tokens.spacingVerticalS }}>
                  <Switch
                    checked={!!needAudit}
                    disabled={loadingAudit || needAudit === null}
                    onChange={(_, data) => handleToggleAudit(!!data.checked)}
                  />
                  <Text size={200} color="subtle" style={{ marginLeft: tokens.spacingHorizontalS }}>
                    {needAudit ? '开' : '关'}
                  </Text>
                </div>
              </div>

              {/* 备份 */}
              <div style={{ marginTop: tokens.spacingVerticalL }}>
                <Text size={300}>备份</Text>
                <div style={{ marginTop: tokens.spacingVerticalS }}>
                  <Button appearance="primary" onClick={handleCreateBackup}>创建并下载备份</Button>
                </div>
              </div>

              {/* 恢复 */}
              <div style={{ marginTop: tokens.spacingVerticalL }}>
                <Text size={300}>恢复</Text>
                <div style={{ marginTop: tokens.spacingVerticalS, display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    style={{ display: 'inline-block' }}
                    onChange={(e) => setSelectedBackupFile(e.target.files?.[0] || null)}
                    disabled={recovering}
                  />
                  <Button appearance="secondary" onClick={() => setConfirmOpen(true)} disabled={!selectedBackupFile || recovering}>
                    恢复备份
                  </Button>
                  {selectedBackupFile && (
                    <Text size={200} color="subtle">已选择：{selectedBackupFile.name}</Text>
                  )}
                </div>
                <Text size={200} color="subtle" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
                  恢复会覆盖现有数据和图片，操作不可逆，建议提前二次备份。
                </Text>
              </div>

              {/* 确认对话框 */}
              <Dialog open={confirmOpen} onOpenChange={(_, data) => setConfirmOpen(!!data.open)}>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>确认恢复</DialogTitle>
                    <DialogContent>
                      恢复备份后，现有内容会被清除，要继续吗？
                    </DialogContent>
                    <DialogActions>
                      <Button appearance="secondary" onClick={() => setConfirmOpen(false)}>取消</Button>
                      <Button appearance="primary" onClick={handleConfirmRecover} disabled={!selectedBackupFile || recovering}>确认</Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </div>
          ) : activeTab === 'postReview' ? (
            <div>
              <Text size={400} weight="semibold">投稿审核</Text>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <TabList
                  selectedValue={postReviewSubTab}
                  onTabSelect={(_, data) => setPostReviewSubTab(data.value)}
                >
                  <Tab value="approved">已过审</Tab>
                  <Tab value="pending">待处理</Tab>
                  <Tab value="rejected">未过审</Tab>
                </TabList>
              </div>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                {postReviewSubTab === 'approved' ? (
                  approvedLoading && approvedArticles.length === 0 ? (
                    <Text size={200}>加载中...</Text>
                  ) : approvedArticles.length === 0 ? (
                    <Text size={200} color="subtle">暂无已过审帖子</Text>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {approvedArticles.map((a, idx) => {
                        const isLast = approvedArticles.length === idx + 1 && approvedHasMore;
                        const card = (
                          <AdminPostCard
                            key={`approved-${a.id}`}
                            id={a.id}
                            content={a.content}
                            disableApprove
                            disableReject
                            onDismiss={async (id) => {
                              try {
                                await reauditPost(id);
                                toast.success(`已重新审核，帖子 #${id} 回到待审核`);
                                setApprovedArticles(prev => prev.filter(x => x.id !== id));
                              } catch (e: any) {
                                const msg = String(e?.message || '重新审核失败');
                                toast.error(msg);
                              }
                            }}
                            onEdit={(id) => setModifyPostModal({ open: true, id, initialContent: a.content, list: 'approved' })}
                            onManageComments={(id) => setManageCommentsModal({ open: true, id })}
                            onDelete={(id) => setDeletePostConfirm({ open: true, id, list: 'approved' })}
                          />
                        );
                        return isLast ? (
                          <div ref={lastApprovedRef} key={`approved-wrap-${a.id}`}>{card}</div>
                        ) : card;
                      })}
                      {approvedLoading && approvedArticles.length > 0 && (
                        <Text size={200} color="subtle">加载中...</Text>
                      )}
                    </div>
                  )
                ) : postReviewSubTab === 'pending' ? (
                  pendingPostsLoading ? (
                    <Text size={200}>加载中...</Text>
                  ) : pendingPosts.length === 0 ? (
                    <Text size={200} color="subtle">暂无待审核帖子</Text>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {pendingPosts.map(p => (
                        <AdminPostCard
                          key={`pending-${p.id}`}
                          id={p.id}
                          content={p.content}
                          disableDismiss
                          onApprove={async (id) => {
                            try {
                              await approvePost(id);
                              toast.success(`已通过帖子 #${id}`);
                              setPendingPosts(prev => prev.filter(x => x.id !== id));
                            } catch (e: any) {
                              const msg = String(e?.message || '审核通过失败');
                              toast.error(msg);
                            }
                          }}
                          onReject={async (id) => {
                            try {
                              await disapprovePost(id);
                              toast.success(`已拒绝帖子 #${id}`);
                              setPendingPosts(prev => prev.filter(x => x.id !== id));
                            } catch (e: any) {
                              const msg = String(e?.message || '拒绝帖子失败');
                              toast.error(msg);
                            }
                          }}
                          onEdit={(id) => setModifyPostModal({ open: true, id, initialContent: p.content, list: 'pending' })}
                          onManageComments={(id) => setManageCommentsModal({ open: true, id })}
                          onDelete={(id) => setDeletePostConfirm({ open: true, id, list: 'pending' })}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  rejectedPostsLoading ? (
                    <Text size={200}>加载中...</Text>
                  ) : rejectedPosts.length === 0 ? (
                    <Text size={200} color="subtle">暂无已拒绝帖子</Text>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {rejectedPosts.map(p => (
                        <AdminPostCard
                          key={`rejected-${p.id}`}
                          id={p.id}
                          content={p.content}
                          disableApprove
                          disableReject
                          disableDismiss
                          disableEdit
                          disableManageComments
                          onDelete={(id) => setDeletePostConfirm({ open: true, id, list: 'rejected' })}
                        />
                      ))}
                    </div>
                  )
                )}
      </div>
      </div>

      
          ) : activeTab === 'imageManage' ? (
            <div>
              <Text size={400} weight="semibold">图片管理</Text>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                {picLoading ? (
                  <Text size={200}>加载中...</Text>
                ) : picList.length === 0 ? (
                  <Text size={200} color="subtle">暂无图片</Text>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: tokens.spacingHorizontalM }}>
                    {picList.map((item, idx) => (
                      <div key={`${picPage}-${item.filename || item.url || 'unknown'}-${item.upload_time || 'na'}-${idx}`} style={{ border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, padding: tokens.spacingHorizontalS }}>
                        {item.url && item.url.trim() !== '' ? (
                          <img src={item.url} alt={item.filename || '图片'} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: tokens.borderRadiusSmall }} />
                        ) : (
                          <div style={{ width: '100%', height: '140px', borderRadius: tokens.borderRadiusSmall, backgroundColor: tokens.colorNeutralBackground3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text size={200} color="subtle">无图片链接</Text>
                          </div>
                        )}
                        <div style={{ marginTop: tokens.spacingVerticalS, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text size={200}>{item.filename}</Text>
                            <Text size={200} color="subtle" style={{ display: 'block' }}>{item.upload_time}</Text>
                          </div>
                          <Button appearance="secondary" onClick={() => requestDeletePic(item.filename)}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: tokens.spacingVerticalM, display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Button appearance="secondary" disabled={picPage <= 1} onClick={() => setPicPage(p => Math.max(1, p - 1))}>上一页</Button>
                <Text size={200} color="subtle">第 {picPage} 页</Text>
                <Button appearance="secondary" onClick={() => setPicPage(p => p + 1)}>下一页</Button>
              </div>

              {/* 删除确认对话框 */}
              <Dialog open={deleteConfirm.open} onOpenChange={(_, data) => setDeleteConfirm({ open: !!data.open, filename: deleteConfirm.filename })}>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>确认删除图片</DialogTitle>
                    <DialogContent>
                      将永久删除服务器上的此图片：{deleteConfirm.filename}
                    </DialogContent>
                    <DialogActions>
                      <Button appearance="secondary" onClick={() => setDeleteConfirm({ open: false })}>取消</Button>
                      <Button appearance="primary" onClick={handleConfirmDeletePic}>确认删除</Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </div>
          ) : activeTab === 'complaintReview' ? (
            <div>
              <Text size={400} weight="semibold">投诉审核</Text>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                {reportsLoading ? (
                  <Text size={200}>加载中...</Text>
                ) : pendingReports.length === 0 ? (
                  <Text size={200} color="subtle">暂无待处理举报</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                    {pendingReports.map((r) => (
                      <div key={r.id} style={{ border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, padding: tokens.spacingHorizontalM }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Text size={300} weight="semibold">{r.title || `举报 #${r.id}`}</Text>
                          <Text size={200} color="subtle">{r.created_at}</Text>
                        </div>
                        <div style={{ marginTop: tokens.spacingVerticalS, whiteSpace: 'pre-wrap' }}>
                          <Text size={200} weight="semibold">帖子内容</Text>
                          <Text size={200} style={{ display: 'block', marginTop: tokens.spacingVerticalS }}>
                            {postContents[r.submission_id] !== undefined
                              ? (postContents[r.submission_id] || '（帖子内容为空）')
                              : '加载中...'}
                          </Text>
                        </div>
                        <div style={{ marginTop: tokens.spacingVerticalS, whiteSpace: 'pre-wrap' }}>
                          <Text size={200} weight="semibold">举报内容</Text>
                          <Text size={200} style={{ display: 'block', marginTop: tokens.spacingVerticalS }}>
                            {r.content || '（无举报内容）'}
                          </Text>
                        </div>
                        <div style={{ marginTop: tokens.spacingVerticalS, display: 'flex', gap: tokens.spacingHorizontalS }}>
                          <Button appearance="primary" onClick={() => handleApproveReport(r.id)}>批准举报</Button>
                          <Button appearance="secondary" onClick={() => handleRejectReport(r.id)}>拒绝举报</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Text size={300}>TODO: {String(activeTab)}</Text>
          )}
          {/* 删除帖子二次确认弹窗（放在内容面板末尾，避免打断三元表达式） */}
          <Dialog open={deletePostConfirm.open} onOpenChange={(_, data) => setDeletePostConfirm(prev => ({ ...prev, open: !!data.open }))}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>确认删除帖子</DialogTitle>
                <DialogContent>
                  该操作不可恢复，确定要永久删除帖子 #{deletePostConfirm.id} 吗？
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setDeletePostConfirm({ open: false })}>取消</Button>
                  <Button appearance="primary" onClick={handleConfirmDeletePost}>删除</Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          {/* 修改帖子弹窗 */}
          {modifyPostModal.open && modifyPostModal.id !== undefined && (
            <div className={styles.modalOverlay}>
              <AdminModifyPost
                postId={modifyPostModal.id}
                initialContent={modifyPostModal.initialContent || ''}
                onClose={() => setModifyPostModal({ open: false })}
                onSubmitSuccess={(newContent) => {
                  if (modifyPostModal.list === 'approved') {
                    setApprovedArticles(prev => prev.map(a => a.id === modifyPostModal.id ? { ...a, content: newContent } : a));
                  } else if (modifyPostModal.list === 'pending') {
                    setPendingPosts(prev => prev.map(p => p.id === modifyPostModal.id ? { ...p, content: newContent } : p));
                  }
                }}
              />
            </div>
          )}
          {manageCommentsModal.open && manageCommentsModal.id !== undefined && (
            <div className={styles.modalOverlay}>
              <AdminManageComments
                postId={manageCommentsModal.id!}
                onClose={() => setManageCommentsModal({ open: false })}
              />
            </div>
          )}
        </div>
      </div>

      {/* 页脚 - 采用 MainLayout 的 Footer 样式 */}
      <footer className={styles.footer}>
        <Text size={200} color="subtle">
          Powered By Sycamore_Whisper
        </Text>
      </footer>
    </div>
  );
};

export default AdminDashboard;