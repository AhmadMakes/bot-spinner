import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'founder@example.com';
const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe123!';
const ownerName = process.env.SEED_OWNER_NAME ?? 'Founder';
const botName = process.env.SEED_BOT_NAME ?? 'Demo AI Receptionist';
const forwardingNumber = process.env.SEED_BOT_FORWARDING_NUMBER ?? '+15550000000';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findUserByEmail(email: string, maxPages = 10) {
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (data.users.length < 200) break;
    await delay(200);
  }
  return null;
}

async function ensureOwnerUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    });

    if (error) {
      if (!error.message.includes('User already registered')) {
        throw error;
      }
    }

    if (data?.user) {
      return data.user;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('User already registered')) {
      throw err;
    }
  }

  const existing = await findUserByEmail(ownerEmail);
  if (!existing) {
    throw new Error(`Failed to find or create user for ${ownerEmail}`);
  }
  return existing;
}

async function ensureBot() {
  const { data: existing, error: selectError } = await supabase
    .from('bots')
    .select('*')
    .eq('name', botName)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    throw selectError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('bots')
    .insert({
      name: botName,
      forwarding_number: forwardingNumber,
      description: 'Demo bot seeded locally',
      greeting_prompt: 'You are the friendly receptionist for the Demo AI bot.',
      fallback_prompt: 'If uncertain, capture info and promise a follow up.',
      default_language: 'en-US',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function ensureMembership(botId: string, ownerId: string) {
  const { error } = await supabase
    .from('bot_members')
    .upsert(
      {
        bot_id: botId,
        user_id: ownerId,
        role: 'owner',
      },
      { onConflict: 'bot_id,user_id' }
    );

  if (error) throw error;
}

async function main() {
  console.log('Seeding baseline data...');
  const owner = await ensureOwnerUser();
  console.log(`✔ Owner user ready (${owner.email})`);

  const bot = await ensureBot();
  console.log(`✔ Bot ready (${bot.name})`);

  await ensureMembership(bot.id, owner.id);
  console.log(`✔ Membership linked (${owner.email} → ${bot.name})`);

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
