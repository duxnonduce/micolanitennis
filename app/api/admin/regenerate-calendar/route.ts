import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { regenerateSlotCalendar } from '@/lib/calendar-service';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: slots } = await service.from('recurring_slots').select('id');

  let totalLessons = 0;
  let totalBookings = 0;
  const errors: string[] = [];

  for (const slot of slots ?? []) {
    try {
      const result = await regenerateSlotCalendar(service, slot.id);
      totalLessons += result.lessonsCreated;
      totalBookings += result.bookingsCreated;
    } catch (e: any) {
      errors.push(`Slot ${slot.id}: ${e.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    slotsProcessed: (slots ?? []).length,
    totalLessons,
    totalBookings,
    errors,
  });
}
