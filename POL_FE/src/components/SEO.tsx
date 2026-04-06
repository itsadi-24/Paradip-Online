import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  schema?: any;
  image?: string;
}

const BASE_URL = 'https://www.paradiponline.com';

const SEO = ({ 
  title, 
  description, 
  canonicalPath, 
  schema, 
  image = '/POL_LOGO.svg'
}: SEOProps) => {
  const location = useLocation();
  
  // Use provided canonicalPath or fall back to current location
  const path = canonicalPath || location.pathname;
  
  // Clean up pathology – remove leading/trailing slashes for consistency
  const cleanPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${BASE_URL}${cleanPath}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  const fullTitle = title 
    ? `${title} | Paradip Online` 
    : "Paradip Online | Best Computer Shop & Laptop Repair in Paradip";

  const fullDescription = description || "Paradip Online is your #1 trusted computer shop in Paradip (Paradeep). Expert laptop repair, AMC services, and premium computer accessories at best prices.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={fullDescription} />
      <meta property="twitter:image" content={imageUrl} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
