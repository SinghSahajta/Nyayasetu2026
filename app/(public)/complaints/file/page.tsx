'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDeviceId } from '@/lib/device';
import {
  Phone,
  FileText,
  Eye,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  RotateCcw,
  MapPin,
  Camera,
  LocateFixed,
  X,
} from 'lucide-react';
import PhoneVerifyFlow from '@/components/complaints/PhoneVerifyFlow';
import CategorySelector from '@/components/complaints/CategorySelector';
import { ComplaintCategory } from '@/types';
import type { ClassifyComplaintResult, PriorityResult } from '@/types';
import PriorityBreakdown from '@/components/priority/PriorityBreakdown';
import { resizeImage } from '@/lib/image';
import type { LatLng } from '@/components/map/LocationPicker';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-lg bg-gray-100 animate-pulse" />,
});

interface NearbyIssue { uid: string; title: string; status: string; priority_band: string; confirmations: number; distance_m: number }
import { classifyComplaint } from '@/lib/classifier';
import { categoryLabel } from '@/constants/categories';
import { useTranslation } from 'react-i18next';

type FilingStep = 1 | 2 | 3 | 4;

const STEP_LABELS = [
  { step: 1, label: 'Verify Phone', icon: Phone },
  { step: 2, label: 'Details', icon: FileText },
  { step: 3, label: 'Review', icon: Eye },
  { step: 4, label: 'Success', icon: CheckCircle },
];


const DEPARTMENT_NAMES: Record<string, string> = {
  dept_001: 'Sanitation & Solid Waste',
  dept_002: 'Water & Sewerage',
  dept_003: 'Electrical & Street Lighting',
  dept_004: 'Roads & Infrastructure',
  dept_005: 'Parks & Environment',
  dept_006: 'Animal Control',
  dept_007: 'Anti-Encroachment',
};

export default function FileComplaintPage() {
  const { t, i18n } = useTranslation();
  // Step state
  const [step, setStep] = useState<FilingStep>(1);

  // Step 1: Phone verification
  const [sessionToken, setSessionToken] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Complaint form
  const [consentPhone, setConsentPhone] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [addressTyped, setAddressTyped] = useState(false); // stop auto-filling once the person edits it
  const [landmark, setLandmark] = useState('');
  const [ward, setWard] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [nearby, setNearby] = useState<NearbyIssue[]>([]);
  const [priority, setPriority] = useState<PriorityResult | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 3: Review - classification preview
  const [classification, setClassification] = useState<ClassifyComplaintResult | null>(null);

  // Step 4: Success
  const [complaintUID, setComplaintUID] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  // ---- Prefill from the chat assistant (/complaints/file?title=..&category=..&description=..) ----
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('title')) setTitle(q.get('title')!);
    if (q.get('description')) setDescription(q.get('description')!);
    const c = q.get('category') as ComplaintCategory | null;
    if (c && Object.values(ComplaintCategory).includes(c)) setCategory(c);
  }, []);

  // ---- Location: pin -> address, and duplicate check ----
  const handleLocation = useCallback(async (p: LatLng) => {
    setLocation(p);
    setLocError('');
    setFormErrors((e) => ({ ...e, location: '' }));
    try {
      const res = await fetch(`/api/geo/reverse?lat=${p.lat}&lng=${p.lng}`);
      const data = await res.json();
      if (!data.success) { setLocError(data.message || ''); if (!addressTyped) setAddress(''); }
      else if (data.place?.address && !addressTyped) setAddress(data.place.address);
    } catch { /* address stays editable */ }
  }, [addressTyped]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError(t('file.noGeo')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); handleLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setLocating(false); setLocError(t('file.geoDenied')); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [handleLocation, t]);

  useEffect(() => {
    if (!location || !category) { setNearby([]); return; }
    fetch(`/api/complaints/nearby?lat=${location.lat}&lng=${location.lng}&category=${category}`)
      .then((res) => res.json())
      .then((d) => setNearby(d.issues ?? []))
      .catch(() => setNearby([]));
  }, [location, category]);

  const handlePhoto = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try { setPhoto(await resizeImage(file)); } catch { setFormErrors((e) => ({ ...e, photo: t('file.photoErr') })); }
  }, [t]);

  // ---- Step 1 callback ----
  const handlePhoneVerified = useCallback((token: string, verifiedPhone: string) => {
    setSessionToken(token);
    setPhone(verifiedPhone);
    setStep(2);
  }, []);

  // ---- Step 2 validation ----
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = t('file.titleReq');
    if (!category) errors.category = t('file.catReq');
    if (!description.trim()) errors.description = t('file.descReq');
    if (description.trim().length < 30) errors.description = t('file.descMin');
    if (!location) errors.location = t('file.pinReq');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, category, description, location, t]);

  const handleNextToReview = useCallback(() => {
    if (!validateForm()) return;

    // Run classifier for preview
    const result = classifyComplaint(description, category!);
    setClassification(result);
    setStep(3);
  }, [validateForm, description, category]);

  // ---- Step 3: Submit ----
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          consent_phone: consentPhone,
          device_id: getDeviceId(),
          title: title.trim(),
          category,
          description: description.trim(),
          address: address.trim(),
          landmark: landmark.trim() || null,
          ward: ward.trim() || null,
          latitude: location?.lat,
          longitude: location?.lng,
          photo,
        }),
      });

      const data = await res.json();

      if (data.success && data.complaint_uid) {
        setComplaintUID(data.complaint_uid);
        setClassification(data.classification);
        setPriority(data.priority ?? null);
        setStep(4);
      } else {
        setSubmitError(data.message || 'Failed to file complaint.');
      }
    } catch {
      setSubmitError(t('complaints.networkError', { defaultValue: 'Network error. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, consentPhone, title, category, description, address, landmark, ward, location, photo, t]);

  // ---- Step 4: Reset ----
  const handleFileAnother = useCallback(() => {
    setStep(1);
    setSessionToken('');
    setPhone('');
    setConsentPhone(false);
    setTitle('');
    setCategory(null);
    setDescription('');
    setAddress('');
    setAddressTyped(false);
    setLandmark('');
    setWard('');
    setLocation(null);
    setPhoto(null);
    setNearby([]);
    setPriority(null);
    setFormErrors({});
    setClassification(null);
    setComplaintUID('');
    setSubmitError('');
  }, []);

  const handleCopyUID = useCallback(() => {
    navigator.clipboard.writeText(complaintUID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [complaintUID]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('complaints.fileTitle', { defaultValue: 'File a Complaint' })}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('complaints.fileSubtitle', { defaultValue: 'Report a civic issue in your area' })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map(({ step: s, label, icon: Icon }, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s
                      ? step === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    step >= s ? 'text-gray-900' : 'text-gray-400'
                  }`}>{t(`complaints.step${s}`, { defaultValue: label })}</span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded ${
                    step > s ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ===== STEP 1: Phone Verification ===== */}
        {step === 1 && (
          <div className="paper bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto">
            <PhoneVerifyFlow onVerified={handlePhoneVerified} />
          </div>
        )}

        {/* ===== STEP 2: Complaint Details ===== */}
        {step === 2 && (
          <div className="paper bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('complaints.detailsTitle', { defaultValue: 'Complaint Details' })}</h2>

            {/* Phone consent: the number is only ever used to let the assigned officer call back */}
            <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer">
              <input type="checkbox" checked={consentPhone} onChange={(e) => setConsentPhone(e.target.checked)} className="mt-1 h-4 w-4" />
              <span className="text-sm">
                <span className="block font-medium text-gray-900">{t('file.consentTitle')}</span>
                <span className="block text-gray-500 mt-0.5">{t('file.consentBody')}</span>
              </span>
            </label>

            {/* Title */}
            <div>
              <label htmlFor="complaint-title" className="block text-sm font-medium text-gray-700 mb-1">
                {t('complaints.complaintTitle', { defaultValue: 'Complaint Title' })} <span className="text-red-500">*</span>
              </label>
              <input
                id="complaint-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFormErrors((p) => ({ ...p, title: '' })); }}
                placeholder={t('file.titlePh')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
              />
              {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('complaints.category', { defaultValue: 'Category' })} <span className="text-red-500">*</span>
              </label>
              <CategorySelector
                selected={category}
                onSelect={(c) => { setCategory(c); setFormErrors((p) => ({ ...p, category: '' })); }}
              />
              {formErrors.category && <p className="text-xs text-red-600 mt-2">{formErrors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="complaint-desc" className="block text-sm font-medium text-gray-700 mb-1">
                {t('complaints.description', { defaultValue: 'Description' })} <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal"> ({t('complaints.minChars', { defaultValue: 'min 30 characters' })})</span>
              </label>
              <textarea
                id="complaint-desc"
                rows={4}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFormErrors((p) => ({ ...p, description: '' })); }}
                placeholder={t('file.descPh')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 resize-none"
              />
              <p className={`text-xs mt-1 ${description.length >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                {description.length}/30 {t('complaints.characters', { defaultValue: 'characters' })}
              </p>
              {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
            </div>

            {/* Location (geo-tag) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <MapPin className="inline w-4 h-4 mr-1 text-indigo-600" />{t('file.location')} <span className="text-red-500">*</span>
                </label>
                <button type="button" onClick={useMyLocation} disabled={locating}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50">
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} {t('file.useMyLocation')}
                </button>
              </div>
              <LocationPicker value={location} onChange={handleLocation} onOutside={() => setLocError(t('file.outsideIndia'))} />
              <p className="text-xs text-gray-500 mt-1">
                {location ? t('file.pinnedAt', { lat: location.lat.toFixed(5), lng: location.lng.toFixed(5) }) : t('file.tapMap')}
              </p>
              <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1.5 mt-2">
                {t('file.privacy')}
              </p>
              {(formErrors.location || locError) && <p className="text-xs text-red-600 mt-1">{formErrors.location || locError}</p>}
              {nearby.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                  <p className="font-medium text-amber-900">{t('file.sameIssue', { count: nearby.length })}</p>
                  <ul className="mt-2 space-y-1">
                    {nearby.slice(0, 3).map((n) => (
                      <li key={n.uid} className="flex items-center justify-between gap-2">
                        <span className="text-amber-900 truncate">{n.title} <span className="text-amber-700">· {t('file.away', { m: n.distance_m })} · {n.priority_band}</span></span>
                        <a href={`/issues/${n.uid}`} className="shrink-0 text-indigo-700 font-medium hover:underline">{t('file.seeToo')}</a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-700 mt-2">{t('file.confirmHint')}</p>
                </div>
              )}
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Camera className="inline w-4 h-4 mr-1 text-indigo-600" />{t('file.photo')} <span className="text-gray-400 font-normal">{t('file.photoOpt')}</span>
              </label>
              {photo ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={t('file.photoPreviewAlt')} className="h-40 rounded-lg border border-gray-200 object-cover" />
                  <button type="button" onClick={() => setPhoto(null)} aria-label={t('file.photoRemove')}
                    className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-300 p-1 hover:bg-gray-50"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(e.target.files?.[0])}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              )}
              {formErrors.photo && <p className="text-xs text-red-600 mt-1">{formErrors.photo}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="complaint-address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('complaints.address', { defaultValue: 'Address' })} <span className="text-gray-400 font-normal">{t('file.addressHint')}</span>
              </label>
              <input
                id="complaint-address"
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setAddressTyped(e.target.value.trim() !== ''); setFormErrors((p) => ({ ...p, address: '' })); }}
                placeholder={t('file.addressPh')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
              />
              {formErrors.address && <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>}
            </div>

            {/* Landmark + Ward side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="complaint-landmark" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('complaints.landmark', { defaultValue: 'Landmark' })} <span className="text-gray-400 font-normal">({t('generic.optional', { defaultValue: 'optional' })})</span>
                </label>
                <input
                  id="complaint-landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder={t('file.landmarkPh')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                    focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="complaint-ward" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('complaints.ward', { defaultValue: 'Ward' })} <span className="text-gray-400 font-normal">({t('generic.optional', { defaultValue: 'optional' })})</span>
                </label>
                <input
                  id="complaint-ward"
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder={t('file.wardPh')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                    focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('complaints.back', { defaultValue: 'Back' })}
              </button>
              <button
                onClick={handleNextToReview}
                className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-indigo-700
                  text-white font-medium hover:bg-indigo-700 transition-all"
              >
                {t('complaints.reviewBtn', { defaultValue: 'Review' })}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Review ===== */}
        {step === 3 && (
          <div className="space-y-5 max-w-3xl mx-auto">
            <div className="paper bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('complaints.reviewYourComplaint', { defaultValue: 'Review Your Complaint' })}</h2>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-500">{t('complaints.phone', { defaultValue: 'Phone' })}</span>
                  <span className="col-span-2 text-gray-900">{consentPhone ? t('file.phoneKept', { phone }) : t('file.phoneNotKept')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-500">{t('complaints.titleLabel', { defaultValue: 'Title' })}</span>
                  <span className="col-span-2 text-gray-900 font-medium">{title}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-500">{t('complaints.category', { defaultValue: 'Category' })}</span>
                  <span className="col-span-2 text-gray-900">
                    {category ? categoryLabel(category, i18n.language) : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-500">{t('complaints.description', { defaultValue: 'Description' })}</span>
                  <span className="col-span-2 text-gray-900">{description}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-500">{t('complaints.address', { defaultValue: 'Address' })}</span>
                  <span className="col-span-2 text-gray-900">{address}</span>
                </div>
                {location && (
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                    <span className="text-gray-500">{t('file.mapPin')}</span>
                    <span className="col-span-2 text-gray-900 font-mono text-xs">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                  </div>
                )}
                {photo && (
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                    <span className="text-gray-500">{t('file.photo')}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={t('file.photoAlt')} className="col-span-2 h-28 rounded-md object-cover" />
                  </div>
                )}
                {landmark && (
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                    <span className="text-gray-500">{t('complaints.landmark', { defaultValue: 'Landmark' })}</span>
                    <span className="col-span-2 text-gray-900">{landmark}</span>
                  </div>
                )}
                {ward && (
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-3">
                    <span className="text-gray-500">{t('complaints.ward', { defaultValue: 'Ward' })}</span>
                    <span className="col-span-2 text-gray-900">{ward}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Classification Preview */}
            {classification && (
              <div className="paper bg-indigo-50 rounded-xl border border-indigo-200 p-5">
                <h3 className="text-sm font-semibold text-indigo-800 mb-3">{t('complaints.aiPreview', { defaultValue: '🤖 AI Classification Preview' })}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-600">{t('complaints.predictedCategory', { defaultValue: 'Predicted Category' })}</span>
                    <span className="font-medium text-indigo-900">
                      {categoryLabel(classification.category, i18n.language)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-600">{t('complaints.department', { defaultValue: 'Department' })}</span>
                    <span className="font-medium text-indigo-900">
                      {DEPARTMENT_NAMES[classification.department_id] ? t(`deptNames.${DEPARTMENT_NAMES[classification.department_id]}`) : classification.department_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-600">{t('complaints.urgency', { defaultValue: 'Urgency' })}</span>
                    <span className={`font-medium ${
                      classification.urgency === 'high' ? 'text-red-700' : 'text-indigo-900'
                    }`}>
                      {t(`urgency.${classification.urgency}`, { defaultValue: classification.urgency })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-600">{t('complaints.confidence', { defaultValue: 'Confidence' })}</span>
                    <span className="font-medium text-indigo-900">
                      {Math.round(classification.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('complaints.editDetails', { defaultValue: 'Edit Details' })}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600
                  text-white font-semibold hover:bg-green-700 disabled:opacity-50
                  disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>{t('complaints.submitComplaint', { defaultValue: 'Submit Complaint' })}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Success ===== */}
        {step === 4 && (
          <div className="paper bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-green-800 mb-2">
              {t('complaints.successTitle', { defaultValue: 'Complaint Filed Successfully!' })}
            </h2>
            <p className="text-gray-500 mb-6">
              {t('complaints.successDesc', { defaultValue: 'Your complaint has been registered. Save the ID below to track progress.' })}
            </p>

            {/* Complaint UID */}
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-5 mb-6 inline-block">
              <p className="text-xs text-gray-400 mb-1">{t('complaints.id', { defaultValue: 'Complaint ID' })}</p>
              <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {complaintUID}
              </p>
              <button
                onClick={handleCopyUID}
                className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
               >
                <Copy className="w-3.5 h-3.5" />
                {copied ? t('complaints.copied', { defaultValue: 'Copied!' }) : t('complaints.copyId', { defaultValue: 'Copy ID' })}
              </button>
            </div>

            {priority && (
              <div className="text-left mb-6">
                <PriorityBreakdown score={priority.score} band={priority.band} factors={priority.factors} />
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 max-w-sm mx-auto">
              <a
                href={`/issues/${complaintUID}`}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-md
                  bg-indigo-700 text-white font-medium hover:bg-slate-800 transition-all"
              >
                {t('complaints.trackStatus', { defaultValue: 'Track This Complaint' })}
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleFileAnother}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-md
                  border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('complaints.fileAnother', { defaultValue: 'File Another Complaint' })}
              </button>
            </div>

            {/* Share instructions */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
              <p className="text-sm text-amber-800">{t('file.tokenWarn')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
