import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { carterColors } from 'shyftlabs-dsl';
import { useGCPSignedUrl } from '@/hooks/useGCPSignedUrl.hook';

type CardBrand = {
  id: number;
  name: string;
  brand_logo_url?: string;
  status: string;
  publisher_share_perc: number;
  allow_all_products: boolean;
  custom_id: string;
};

type IBrandCardViewProps = {
  brands: CardBrand[];
  loading: boolean;
  pageNo: number;
  pageSize: number;
  totalCount: number;
  onPaginationChange: (pageNo: number, pageSize: number) => void;
};

// Card view component
const BrandCard: React.FC<{ brand: CardBrand }> = ({ brand }) => {
  const router = useRouter();
  const isActive = brand.status === 'active';
  const isArchived = brand.status === 'archived';
  
  // Get signed URL for brand logo viewing
  const { url: logoUrl, loading: logoLoading, error: logoError } = useGCPSignedUrl(
    brand.brand_logo_url || null,
    'read',
    { expirationMinutes: 10 }
  );
  
  let statusBgColor, statusColor;
  if (isActive) {
    statusBgColor = '#E8F5E8';
    statusColor = '#2E7D32';
  } else if (isArchived) {
    statusBgColor = '#FFF3E0';
    statusColor = '#F57C00';
  } else {
    statusBgColor = '#FFEBEE';
    statusColor = '#C62828';
  }

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: 0,
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }}
    onClick={() => {
      router.push(`/brand/${brand.id}`);
    }}
    >
      {/* Asset preview on top */}
      {brand.brand_logo_url ? (
        <div style={{ width: '100%', height: 260, backgroundColor: '#f5f5f5' }}>
          {logoLoading ? (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              Loading...
            </div>
          ) : logoError ? (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#c62828',
              backgroundColor: '#ffebee'
            }}>
              Error loading image
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl || brand.brand_logo_url}
              alt={brand.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: 160, backgroundColor: '#eef2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90a4ae', fontWeight: 600 }}>
          No Image
        </div>
      )}

      {/* Details below */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px 0 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            color: carterColors['links-blue'], 
            fontWeight: 600,
            fontSize: '16px'
          }}>
            {brand.name}
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Status:</span>
          <span 
            style={{ 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: statusBgColor,
              color: statusColor
            }}
          >
            {brand.status.charAt(0).toUpperCase() + brand.status.slice(1)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Publisher Share:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{brand.publisher_share_perc}%</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Allow All Products:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {brand.allow_all_products ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Custom ID:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{brand.custom_id}</span>
        </div>
      </div>
    </div>
  );
};

const BrandCardView: React.FC<IBrandCardViewProps> = ({ 
  brands, 
  loading, 
  pageNo, 
  pageSize, 
  totalCount, 
  onPaginationChange 
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Loading brands...
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Brands Yet</h3>
        <p>Click + New Brand to create</p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {brands.map((brand: CardBrand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
      
      {/* Simple pagination for grid view */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '16px',
        padding: '20px 0'
      }}>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: pageNo <= 1 ? 'not-allowed' : 'pointer',
            opacity: pageNo <= 1 ? 0.5 : 1
          }}
          disabled={pageNo <= 1}
          onClick={() => onPaginationChange(pageNo - 1, pageSize)}
        >
          Previous
        </button>
        <span style={{ fontSize: '14px' }}>
          Page {pageNo} of {Math.ceil(totalCount / pageSize)}
        </span>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: pageNo >= Math.ceil(totalCount / pageSize) ? 'not-allowed' : 'pointer',
            opacity: pageNo >= Math.ceil(totalCount / pageSize) ? 0.5 : 1
          }}
          disabled={pageNo >= Math.ceil(totalCount / pageSize)}
          onClick={() => onPaginationChange(pageNo + 1, pageSize)}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default BrandCardView;
