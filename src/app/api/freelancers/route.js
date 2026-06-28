import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../lib/rate-limit';
import { failClosedResponse } from '../../lib/security';

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // e.g. designer, developer, consultant, marketer

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return failClosedResponse('Freelancer profiles');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('card_profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    let profiles = data || [];

    // 2. Filter by role/keywords if provided
    if (role) {
      const lowerRole = role.toLowerCase();
      profiles = profiles.filter(p => {
        const title = (p.title || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        
        let tags = [];
        if (Array.isArray(p.tags)) {
          tags = p.tags;
        } else if (typeof p.tags === 'string') {
          try {
            tags = JSON.parse(p.tags);
          } catch(e) {
            tags = p.tags.split(',').map(s => s.trim());
          }
        }
        const lowerTags = tags.map(t => String(t).toLowerCase());

        return title.includes(lowerRole) || 
               bio.includes(lowerRole) || 
               lowerTags.some(tag => tag.includes(lowerRole)) ||
               (lowerRole === 'developer' && title.includes('dev')) ||
               (lowerRole === 'designer' && title.includes('design')) ||
               (lowerRole === 'marketer' && title.includes('marketing')) ||
               (lowerRole === 'consultant' && title.includes('consulting'));
      });
    }

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching freelancers list:', error);
    return NextResponse.json({ error: 'Failed to retrieve freelancers list' }, { status: 500 });
  }
}
