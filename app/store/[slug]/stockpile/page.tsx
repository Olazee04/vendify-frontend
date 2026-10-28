'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StockpileRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug as string);

  useEffect(() => {
    if (slug) router.replace(`/store/${slug}/account`);
  }, [slug]);

  return null;
}