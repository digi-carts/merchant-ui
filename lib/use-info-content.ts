'use client';

import { useEffect, useState } from 'react';
import { api } from './api';

export interface InfoSection {
  title?: string;
  steps?: string[];
  note?: string;
  youtubeUrl?: string;
}

export interface InfoContent {
  payment?: InfoSection;
  shipping?: InfoSection;
  ai?: InfoSection;
  emailNotif?: InfoSection;
  whatsappNotif?: InfoSection;
}

const DEFAULTS: InfoContent = {
  payment: {
    title: 'How to set up Razorpay',
    steps: [
      'Sign up at razorpay.com and complete your KYC verification',
      'From the Dashboard go to Settings → API Keys',
      'Click Generate Test Key — you\'ll get a Key ID (rzp_test_xxxx) and Key Secret',
      'Copy both values and paste them into the fields below',
      'For live payments: switch your Razorpay account to Live mode and regenerate the keys — the Key ID will start with rzp_live_',
      'Check Enable Razorpay and save',
    ],
    note: 'Test mode keys won\'t charge real money. Use card number 4111 1111 1111 1111 for test payments.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=razorpay+api+key+setup+tutorial',
  },
  shipping: {
    title: 'How to get NimbusPost API Key',
    steps: [
      'Sign up at nimbuspost.com and complete your account verification',
      'Log in and go to Settings → API from the left sidebar',
      'Click Generate API Key — copy the key and secret shown',
      'Paste them into the NimbusPost API Key and API Secret fields below',
      'Enter your Pickup Pincode — this is where parcels are collected from',
      'Save. Your store will now show live courier rates at checkout.',
    ],
    note: 'Alternatively, use your NimbusPost email + password if you don\'t have an API key yet.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=nimbuspost+api+key+setup+tutorial',
  },
  ai: {
    title: 'How to get a Gemini API Key',
    steps: [
      'Go to Google AI Studio at aistudio.google.com/apikey',
      'Sign in with your Google account',
      'Click Create API Key → select a Google Cloud project (or create one)',
      'Copy the key shown and paste it into the field below',
    ],
    note: 'The free tier has generous quota — enough for most stores. No billing required to start.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=google+gemini+api+key+get+started+tutorial',
  },
  emailNotif: {
    title: 'How to set up Gmail SMTP',
    steps: [
      'Go to myaccount.google.com/apppasswords (you must have 2-Step Verification enabled)',
      'Click Select app → choose Other (custom name) → type digi-carts → click Generate',
      'Copy the 16-character password shown → paste it into the App Password field below',
      'Fill in: Host = smtp.gmail.com, Port = 587, Email = your Gmail address',
      'Toggle Enable, save, then click Send Test Email to verify',
    ],
    note: 'Regular Gmail password won\'t work — you must use an App Password.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=gmail+smtp+app+password+setup+tutorial',
  },
  whatsappNotif: {
    title: 'How to set up WhatsApp notifications',
    steps: [
      'Go to developers.facebook.com/apps → Create App → choose Business',
      'Add the WhatsApp product → go to API Setup',
      'Copy the Phone Number ID and the temporary Access Token',
      'For a permanent token: go to Meta Business Manager → System Users → create one and assign WhatsApp permissions',
    ],
    note: 'For Twilio: sign up at twilio.com and use AccountSID:AuthToken as the API key.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=whatsapp+business+api+meta+setup+tutorial',
  },
};

let cached: InfoContent | null = null;

export function useInfoContent(): InfoContent {
  const [content, setContent] = useState<InfoContent>(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) { setContent(cached); return; }
    api.get('/platform/platform-config/info-content')
      .then(r => {
        const remote = r.data as InfoContent;
        const merged: InfoContent = {};
        (Object.keys(DEFAULTS) as (keyof InfoContent)[]).forEach(k => {
          merged[k] = { ...DEFAULTS[k], ...(remote[k] || {}) } as InfoSection;
          if (remote[k]?.steps?.length) merged[k]!.steps = remote[k]!.steps;
        });
        cached = merged;
        setContent(merged);
      })
      .catch(() => {});
  }, []);

  return content;
}

export { DEFAULTS as INFO_DEFAULTS };
