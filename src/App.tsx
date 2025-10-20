import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostCard from './components/PostCard';
import MainLayout from './layouts/MainLayout';
import './App.css';
import { fetchArticles } from './api';
import CreatePost from './components/CreatePost';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AboutPage from './components/AboutPage';
import PostState from './components/PostState';
import ReportState from './components/ReportState';
import AdminPage from './components/AdminPage';
import InitPage from './pages/InitPage';
import NotFound from './pages/NotFound';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [articles, setArticles] = useState<Array<{
    id: number;
    content: string;
    upvotes: number;
    downvotes: number;
  }>>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>(null);

  const lastArticleRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadArticles = async () => {
      if (!hasMore) return;
      setLoading(true);
      try {
        const newArticles = await fetchArticles(page, signal);
        if (newArticles.length === 0) {
          setHasMore(false);
        } else {
          setArticles(prev => [...prev, ...newArticles]);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to load articles:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadArticles();

    return () => {
      controller.abort();
    };
  }, [page, hasMore]);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />}>
            <Route
              index
              element={
                <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflowY: 'auto', padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%' }}>
                    {articles.map((article, index) => {
                      if (articles.length === index + 1 && hasMore) {
                        return (
                          <div ref={lastArticleRef} key={article.id}>
                            <PostCard
                              id={article.id}
                              content={article.content}
                              upvotes={article.upvotes}
                              downvotes={article.downvotes}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <PostCard
                            key={article.id}
                            id={article.id}
                            content={article.content}
                            upvotes={article.upvotes}
                            downvotes={article.downvotes}
                          />
                        );
                      }
                    })}
                    {loading && <div>加载中...</div>}
                  </div>
                </div>
              }
            />
            <Route path="create" element={<CreatePost />} />
            <Route path="/progress/review" element={<PostState />} />
            <Route path="/progress/complaint" element={<ReportState />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="/init" element={<InitPage />} />
          <Route path="/admin" element={<AdminPage isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />} />
           <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </FluentProvider>
  );
}

export default App;
