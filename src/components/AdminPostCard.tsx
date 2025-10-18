import React from 'react';
import {
  makeStyles,
  Card,
  CardFooter,
  Button,
  tokens,
  Text,
} from '@fluentui/react-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  ArrowUndo24Regular,
  Edit24Regular,
  Comment24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  card: {
    width: '100%',
    maxWidth: '800px',
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  content: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: '1em',
      marginBottom: '0.5em',
      fontWeight: 'bold',
    },
    '& p': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
      lineHeight: '1.6',
    },
    '& ul, & ol': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
      paddingLeft: '2em',
    },
    '& li': {
      marginTop: '0.25em',
      marginBottom: '0.25em',
    },
    '& blockquote': {
      margin: '1em 0',
      paddingLeft: '1em',
      borderLeft: `3px solid ${tokens.colorNeutralStroke1}`,
      color: tokens.colorNeutralForeground2,
    },
    '& code': {
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '2px 4px',
      borderRadius: '3px',
      fontFamily: 'monospace',
    },
    '& pre': {
      backgroundColor: tokens.colorNeutralBackground1,
      padding: '1em',
      borderRadius: '5px',
      overflowX: 'auto',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& th, & td': {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      padding: '8px',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: tokens.colorNeutralBackground1,
      fontWeight: 'bold',
    },
    '& ins': {
      textDecoration: 'underline',
      backgroundColor: 'transparent',
    },
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    alignItems: 'center',
    justifyItems: 'center',
    gap: '0 8px',
  },
});

export interface AdminPostCardProps {
  id: number;
  content: string;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onDismiss?: (id: number) => void; // 驳回
  onEdit?: (id: number) => void;
  onManageComments?: (id: number) => void;
  onDelete?: (id: number) => void;
  disableApprove?: boolean;
  disableReject?: boolean;
  disableDismiss?: boolean;
  disableEdit?: boolean;
  disableManageComments?: boolean;
  disableDelete?: boolean;
}

const AdminPostCard: React.FC<AdminPostCardProps> = ({
  id,
  content,
  onApprove,
  onReject,
  onDismiss,
  onEdit,
  onManageComments,
  onDelete,
  disableApprove,
  disableReject,
  disableDismiss,
  disableEdit,
  disableManageComments,
  disableDelete,
}) => {
  const styles = useStyles();
  const markdownContent = content;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text size={300} weight="semibold">帖子 #{id}</Text>
      </div>
      <div className={styles.content}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns]}>{markdownContent}</ReactMarkdown>
        </div>
      </div>
      <CardFooter>
        <div className={styles.actions}>
          <Button appearance="transparent" icon={<Checkmark24Regular />} onClick={() => onApprove?.(id)} disabled={!!disableApprove} />
          <Button appearance="transparent" icon={<Dismiss24Regular />} onClick={() => onReject?.(id)} disabled={!!disableReject} />
          <Button appearance="transparent" icon={<ArrowUndo24Regular />} onClick={() => onDismiss?.(id)} disabled={!!disableDismiss} />
          <Button appearance="transparent" icon={<Edit24Regular />} onClick={() => onEdit?.(id)} disabled={!!disableEdit} />
          <Button appearance="transparent" icon={<Comment24Regular />} onClick={() => onManageComments?.(id)} disabled={!!disableManageComments} />
          <Button appearance="transparent" icon={<Delete24Regular />} onClick={() => onDelete?.(id)} disabled={!!disableDelete} />
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdminPostCard;