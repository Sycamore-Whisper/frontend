import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkIns from 'remark-ins';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  markdownContent: {
    // Markdown样式优化
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
});

const AboutPage: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const styles = useStyles();

  useEffect(() => {
    fetch('/about.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('找不到about.md，请检查文件是否存在。');
        }
        return response.text();
      })
      .then(text => setMarkdown(text))
      .catch(error => {
        console.error('Error fetching about.md:', error);
        toast.error(error.message);
      });
  }, []);

  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkIns]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default AboutPage;