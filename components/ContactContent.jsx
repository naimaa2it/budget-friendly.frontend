'use client';

import React, { useState } from 'react';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';
import { useLanguage } from '@/components/context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ContactContent() {
  const { contactInfo } = useStoreSettings();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      clearTimeout(tid);
      setStatus('error');
      setErrorMsg(
        err.name === 'AbortError'
          ? t('contact.timeout_error')
          : err.message
      );
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{t('contact.title')}</h1>
      <p className="text-gray-600 mb-8">{t('contact.desc')}</p>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-5 text-green-800 text-sm">
          <p className="font-semibold mb-1">{t('contact.success_title')}</p>
          <p>{t('contact.success_msg')}</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.name_label')}</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]"
              placeholder={t('contact.name_ph')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.email_label')}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]"
              placeholder={t('contact.email_ph')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.message_label')}</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]"
              placeholder={t('contact.message_ph')}
            />
          </div>
          {status === 'error' && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-2 bg-rose-600 text-white rounded-full text-sm hover:opacity-90 disabled:opacity-60"
          >
            {status === 'loading' ? t('contact.sending') : t('contact.send')}
          </button>
        </form>
      )}

      {(contactInfo?.phone || contactInfo?.email || contactInfo?.address) && (
        <div className="mt-10 text-sm text-gray-600 space-y-1.5">
          {contactInfo.phone && (
            <p className="flex items-center gap-2">
              <span>📞</span>
              <a href={`tel:${contactInfo.phone}`} className="hover:text-rose-600">{contactInfo.phone}</a>
            </p>
          )}
          {contactInfo.email && (
            <p className="flex items-center gap-2">
              <span>📧</span>
              <a href={`mailto:${contactInfo.email}`} className="hover:text-rose-600">{contactInfo.email}</a>
            </p>
          )}
          {contactInfo.address && (
            <p className="flex items-start gap-2">
              <span>📍</span>
              <span>{contactInfo.address}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}
