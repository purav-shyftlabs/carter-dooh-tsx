import React from 'react';
import ImageViewer from './image-viewer.component';
import VideoPlayer from './video-player.component';
import WebsiteViewer from './website-viewer.component';
import IntegrationViewer from './integration-viewer.component';
import PlaylistViewer from './playlist-viewer.component';
import type { File as LibraryFile } from '@/types/folder';

export type ContentRendererProps = {
  type: 'image' | 'video' | 'website' | 'integration' | 'playlist';
  file?: LibraryFile;
  url?: string;
  integrationId?: number;
  playlistId?: number;
  integrationName?: string;
  appName?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  onEnded?: () => void;
};

/**
 * Unified content renderer that automatically selects the appropriate viewer
 * based on the content type.
 */
const ContentRenderer: React.FC<ContentRendererProps> = ({
  type,
  file,
  url,
  integrationId,
  playlistId,
  integrationName,
  appName,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  controls = false,
  className,
  style,
  onLoad,
  onError,
  onEnded,
}) => {
  switch (type) {
    case 'image':
      return (
        <ImageViewer
          file={file}
          url={url}
          className={className}
          style={style}
          onLoad={onLoad}
          onError={onError}
        />
      );

    case 'video':
      return (
        <VideoPlayer
          file={file}
          url={url}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          className={className}
          style={style}
          onLoad={onLoad}
          onError={onError}
          onEnded={onEnded}
        />
      );

    case 'website':
      return (
        <WebsiteViewer
          url={url || ''}
          title={file?.name || file?.original_filename}
          className={className}
          style={style}
          onLoad={onLoad}
          onError={onError}
        />
      );

    case 'integration':
      if (!integrationId) {
        return (
          <div className={className} style={style}>
            <div>Integration ID is required</div>
          </div>
        );
      }
      return (
        <IntegrationViewer
          integrationId={integrationId}
          integrationName={integrationName}
          appName={appName}
          className={className}
          style={style}
          onLoad={onLoad}
          onError={onError}
        />
      );

    case 'playlist':
      if (!playlistId) {
        return (
          <div className={className} style={style}>
            <div>Playlist ID is required</div>
          </div>
        );
      }
      return (
        <PlaylistViewer
          playlistId={playlistId}
          autoPlay={autoPlay}
          className={className}
          style={style}
          onLoad={onLoad}
          onError={onError}
        />
      );

    default:
      return (
        <div className={className} style={style}>
          <div>Unsupported content type: {type}</div>
        </div>
      );
  }
};

export default ContentRenderer;

