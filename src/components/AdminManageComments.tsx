import React from 'react';
import { makeStyles, shorthands, tokens, Button, Input, Textarea, Dropdown, Option, Card, Text } from '@fluentui/react-components';
import { getComments, type Comment as CommentType } from '../api';
import { deleteComment, modifyComment } from '../admin_api';
import { toast } from 'react-toastify';

const useStyles = makeStyles({
  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(860px, 96vw)',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxHeight: '80vh',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
  },
  closeButton: {
    position: 'absolute',
    right: tokens.spacingHorizontalM,
    top: tokens.spacingVerticalM,
  },
  commentsList: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  commentCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow8,
    marginBottom: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    width: '100%',
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    color: tokens.colorNeutralForeground1,
  },
  nickname: {
    fontWeight: tokens.fontWeightSemibold,
  },
  commentMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  childComment: {
    marginLeft: tokens.spacingHorizontalL,
    borderLeft: `2px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalM,
  },
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  fieldRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  fieldControl: {
    flex: 1,
  },
});

type AdminManageCommentsProps = {
  postId: number;
  onClose: () => void;
};

const AdminManageComments: React.FC<AdminManageCommentsProps> = ({ postId, onClose }) => {
  const styles = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [nickname, setNickname] = React.useState('');
  const [content, setContent] = React.useState('');
  const [parentId, setParentId] = React.useState<number>(0);
  const depthMap = React.useMemo(() => {
    const map = new Map<number, number>();
    const idToParent = new Map<number, number>();
    comments.forEach(c => idToParent.set(c.id, (c.parent_comment_id as any) ?? 0));
    const calcDepth = (id: number) => {
      if (map.has(id)) return map.get(id)!;
      let d = 0;
      let current = id;
      const seen = new Set<number>();
      while (true) {
        seen.add(current);
        const p = idToParent.get(current) ?? 0;
        if (p === 0 || !idToParent.has(p) || seen.has(p)) break;
        d += 1;
        current = p;
      }
      map.set(id, d);
      return d;
    };
    comments.forEach(c => calcDepth(c.id));
    return map;
  }, [comments]);

  const loadComments = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await getComments(postId);
      setComments(list);
    } catch (e: any) {
      toast.error(`加载评论失败：${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  React.useEffect(() => {
    loadComments();
  }, [loadComments]);

  const startEdit = (c: CommentType) => {
    setEditingId(c.id);
    setNickname(c.nickname || '');
    setContent(c.content || '');
    setParentId((c.parent_comment_id as any) ?? 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNickname('');
    setContent('');
    setParentId(0);
  };

  const submitEdit = async () => {
    if (editingId === null) return;
    if (parentId === editingId) {
      toast.error('父评论不能设置为自己');
      return;
    }
    try {
      await modifyComment(editingId, content, Number(parentId), nickname);
      toast.success('修改评论成功');
      setComments(prev => prev.map(c => c.id === editingId ? { ...c, content, nickname, parent_comment_id: Number(parentId) } : c));
      cancelEdit();
    } catch (e: any) {
      toast.error(e?.message || '修改评论失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!id && id !== 0) return;
    try {
      await deleteComment(id);
      toast.success('删除评论成功');
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      toast.error(e?.message || '删除评论失败');
    }
  };

  // 递归渲染函数工厂（用于显示树形结构）
  const renderComments = React.useMemo(() => {
    return renderCommentsFactory(comments, styles, startEdit, handleDelete);
  }, [comments, styles]);

  return (
    <div className={styles.modalContent}>
      <div className={styles.titleRow}>
        <div className={styles.title}>评论管理</div>
        <Button appearance="subtle" className={styles.closeButton} onClick={onClose}>关闭</Button>
      </div>
      <div className={styles.commentMeta}>帖子 #{postId}</div>

      {editingId !== null && (
        <div className={styles.editor}>
          <Text size={300} weight="semibold">修改评论 #{editingId}</Text>
          <div className={styles.fieldRow}>
            <Input className={styles.fieldControl} value={nickname} onChange={(_, d) => setNickname(d.value)} placeholder="用户名" />
            <Dropdown
              className={styles.fieldControl}
              selectedOptions={[String(parentId)]}
              onOptionSelect={(_, data) => setParentId(Number(data.optionValue))}
            >
              <Option value={String(0)}>顶级评论（无父评论）</Option>
              {comments.filter(c => c.id !== editingId).map(c => {
                const depth = depthMap.get(c.id) ?? 0;
                const indent = ' '.repeat(Math.max(0, depth * 2));
                return (
                  <Option key={c.id} value={String(c.id)}>{`${indent}#${c.id} - ${c.nickname}`}</Option>
                );
              })}
            </Dropdown>
          </div>
          <Textarea value={content} onChange={(_, d) => setContent(d.value)} resize={'vertical'} placeholder="评论内容" />
          <div className={styles.actionsRow}>
            <Button appearance="primary" onClick={submitEdit}>保存修改</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </div>
        </div>
      )}

      <div className={styles.commentsList}>
        {loading && <div>加载中...</div>}
        {!loading && comments.length === 0 && <div>暂无评论</div>}
        {!loading && renderComments(0, 0)}
      </div>
    </div>
  );
};

export default AdminManageComments;

function renderCommentsFactory(comments: CommentType[], styles: ReturnType<typeof useStyles>, startEdit: (c: CommentType) => void, handleDelete: (id: number) => void) {
  const renderComments = (parentId: number = 0, level: number = 0): React.ReactNode => {
    return comments
      .filter(comment => (comment.parent_comment_id ?? 0) === parentId)
      .map(comment => (
        <div key={comment.id} className={level > 0 ? styles.childComment : ''}>
          <Card className={styles.commentCard}>
            <div className={styles.commentHeader}>
              <Text className={styles.nickname}>{comment.nickname}</Text>
              <Text size={200} className={styles.commentMeta}>#{comment.id} {comment.parent_comment_id ? `↪ 回复 #${comment.parent_comment_id}` : '· 顶级评论'}</Text>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</div>
            <div className={styles.actionsRow}>
              <Button size="small" onClick={() => startEdit(comment)}>编辑</Button>
              <Button size="small" appearance="subtle" onClick={() => handleDelete(comment.id)}>删除</Button>
            </div>
          </Card>
          {renderComments(comment.id, level + 1)}
        </div>
      ));
  };
  return renderComments;
}