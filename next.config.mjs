/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required on Next 14.x to make instrumentation.ts run at server boot.
  // Used by Fix #11 to refuse prod boot if TWILIO_SKIP_SIGNATURE_VALIDATION=true.
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
