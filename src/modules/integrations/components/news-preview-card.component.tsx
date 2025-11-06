import React from 'react';
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
      <div className={styles.newsWidget}>
        <div className={styles.newsCardEmpty}>
          <Newspaper size={48} color="#999" />
          <p>No news articles available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newsWidget}>
      <div className={styles.newsWidgetHeader}>
        <div className={styles.newsWidgetTitle}>
          <Newspaper size={24} color="#1976d2" />
          <h3>Latest News</h3>
        </div>
        {totalResults && (
          <span className={styles.newsWidgetCount}>{totalResults} articles</span>
        )}
      </div>

      <div className={styles.newsWidgetGrid}>
        {articles.slice(0, 6).map((article, index) => (
          <div key={index} className={styles.newsWidgetCard}>
            {article.urlToImage && (
              <div className={styles.newsWidgetImage}>
                <img src={article.urlToImage} alt={article.title || 'News article'} />
              </div>
            )}
            <div className={styles.newsWidgetContent}>
              <h4 className={styles.newsWidgetCardTitle}>
                {article.title || 'No title'}
              </h4>
              {article.description && (
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
                  Read more <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {articles.length > 6 && (
        <div className={styles.newsWidgetFooter}>
          <span>Showing 6 of {articles.length} articles</span>
        </div>
      )}
    </div>
  );
};

export default NewsPreviewCard;

