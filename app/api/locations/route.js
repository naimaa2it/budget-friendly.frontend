import { locationData } from '@/lib/locationData';

export async function GET(request) {
  // simply return the pre-defined data; could be replaced by remote fetch
  return new Response(JSON.stringify({ locationData }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
