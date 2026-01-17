import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, canonical, ogImage, ogType = 'website' }) => {
  const siteName = 'Spark Trainings';
  const fullTitle = `${title} | ${siteName}`;
  const defaultDescription = 'Spark Trainings offers professional online and onsite courses to help you master new skills and advance your career globally.';
  const defaultKeywords = 'online courses, professional training, skill development, career growth, spark trainings, pakistan training, worldwide learning';
  const siteUrl = 'https://sparktrainings.pk'; // Update with your real URL

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
};

export default SEO;
