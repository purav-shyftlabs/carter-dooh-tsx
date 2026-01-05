import React, { useEffect, useRef, useState } from 'react';
import { Newspaper, ExternalLink, Calendar, User } from 'lucide-react';
import styles from '../styles/integrations.module.scss';

interface NewsArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  author?: string;
  source?: {
    name?: string;
    id?: string;
  };
}

interface NewsData {
  articles?: NewsArticle[];
  totalResults?: number;
  status?: string;
}

interface NewsPreviewCardProps {
  newsData: NewsData | Record<string, unknown>;
}

const NewsPreviewCard: React.FC<NewsPreviewCardProps> = ({ newsData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [showHeader, setShowHeader] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [maxArticles, setMaxArticles] = useState(6);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const width = containerRef.current.clientWidth;
        setContainerHeight(height);
        setContainerWidth(width);
        
        // Show header only if height > 100px
        setShowHeader(height > 100);
        
        // Show images only if width > 250px
        setShowImages(width > 250);
        
        // Show description only if height > 200px AND width > 300px
        setShowDescription(height > 200 && width > 300);
        
        // Show footer only if height > 400px
        setShowFooter(height > 400);
        
        // Adjust number of articles based on available space
        if (height < 300 || width < 400) {
          setMaxArticles(2);
        } else if (height < 500 || width < 600) {
          setMaxArticles(4);
        } else {
          setMaxArticles(6);
        }
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  // Handle different data formats
  const articles: NewsArticle[] = Array.isArray(newsData.articles)
    ? newsData.articles
    : Array.isArray(newsData)
    ? (newsData as NewsArticle[])
    : [];

  const totalResults = newsData.totalResults || newsData.total_results || articles.length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (articles.length === 0) {
    return (
      <div ref={containerRef} className={styles.newsWidget}>
        <div className={styles.newsCardEmpty}>
          <Newspaper size={containerWidth > 200 ? 48 : 32} color="#999" />
          <p>No news articles available</p>
        </div>
      </div>
    );
  }

  const displayArticles = articles.slice(0, maxArticles);

  return (
    <div ref={containerRef} className={styles.newsWidget}>
      {showHeader && (
        <div className={styles.newsWidgetHeader}>
          <div className={styles.newsWidgetTitle}>
            <Newspaper size={containerWidth > 300 ? 24 : 20} color="#1976d2" />
            <h3>Latest News</h3>
          </div>
          {totalResults && showHeader && (
            <span className={styles.newsWidgetCount}>{totalResults} articles</span>
          )}
        </div>
      )}

      <div className={styles.newsWidgetGrid}>
        {displayArticles.map((article, index) => (
          <div key={index} className={styles.newsWidgetCard}>
            {showImages && article.urlToImage && (
              <div className={styles.newsWidgetImage}>
                <img src={article.urlToImage} alt={article.title || 'News article'} />
              </div>
            )}
            <div className={styles.newsWidgetContent}>
              <h4 className={styles.newsWidgetCardTitle}>
                {article.title || 'No title'}
              </h4>
              {showDescription && article.description && (
                <p className={styles.newsWidgetCardDescription}>{article.description}</p>
              )}
              <div className={styles.newsWidgetCardMeta}>
                {article.source?.name && (
                  <span className={styles.newsWidgetCardSource}>{article.source.name}</span>
                )}
                {article.publishedAt && (
                  <span className={styles.newsWidgetCardDate}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.newsWidgetCardLink}
                >
                  Read more <ExternalLink size={containerWidth > 300 ? 14 : 12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showFooter && articles.length > maxArticles && (
        <div className={styles.newsWidgetFooter}>
          <span>Showing {maxArticles} of {articles.length} articles</span>
        </div>
      )}
    </div>
  );
};

export default NewsPreviewCard;

