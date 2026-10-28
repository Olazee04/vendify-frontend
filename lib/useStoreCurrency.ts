'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatMoney, formatCompact } from '@/lib/currency';

export function useStoreCurrency() {
  const [currency, setCurrency] = useState('NGN');

  useEffect(() => {
    api.get('/stores/my-store')
      .then((res) => setCurrency(res.data.data?.currency ?? 'NGN'))
      .catch(() => {});
  }, []);

  return {
    currency,
    fmt: (n: number) => formatMoney(n, currency),
    fmtCompact: (n: number) => formatCompact(n, currency),
  };
}