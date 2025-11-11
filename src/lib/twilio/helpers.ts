import type { NextRequest } from 'next/server';

export type TwilioPayload = Record<string, string>;

export const parseTwilioFormBody = async (req: NextRequest): Promise<TwilioPayload> => {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const entries: TwilioPayload = {};
  params.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
};

export const buildAbsoluteUrl = (req: NextRequest, path: string) => {
  if (process.env.TWILIO_PUBLIC_BASE_URL) {
    return new URL(path, process.env.TWILIO_PUBLIC_BASE_URL).toString();
  }
  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  return new URL(path, origin).toString();
};

export const buildTwiMLResponse = (inner: string) =>
  ['<?xml version="1.0" encoding="UTF-8"?>', '<Response>', inner, '</Response>'].join('');
