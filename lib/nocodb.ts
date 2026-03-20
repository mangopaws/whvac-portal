// ──────────────────────────────────────────────────────────────
// MemberRecord — mirrors actual NocoDB snake_case column names.
// This is what the API returns on reads.
// ──────────────────────────────────────────────────────────────
export interface MemberRecord {
  id?: string;
  userId?: string;
  // Core identity
  full_name?: string;
  email: string;
  phone?: string;
  province?: string;
  // Membership
  membership_type: "individual" | "student" | "corporate";
  trade_affiliation?: string;
  sector?: string;
  experience_trades?: string;
  job_title?: string;
  company_name?: string;
  company_size?: string;
  // Student fields
  school_program?: string;
  graduation_year?: string;
  // Mentor / ambassador fields
  experience_mentor?: string;
  mentor_areas?: string;
  mentor_hours?: string;
  ambassador_why?: string;
  ambassador_org?: string;
  ambassador_background?: string;
  ambassador_rep?: string;
  // Misc / survey
  social_ref?: string;
  interested?: string;
  referral_source?: string;
  anything_else?: string;
  // Payment
  payment_status: "pending" | "active" | "failed" | "cancelled";
  payment_method?: "stripe" | "emt" | "cash" | "paid";
  stripe_payment_id?: string;
  join_date?: string;
  activated_at?: string;
}

// ──────────────────────────────────────────────────────────────
// CreateMemberInput — camelCase shape accepted by callers.
// createMemberRecord maps these to the snake_case NocoDB columns.
// ──────────────────────────────────────────────────────────────
export interface CreateMemberInput {
  userId: string;
  email: string;
  firstName: string;          // ─┐ combined → full_name
  lastName: string;           // ─┘
  tier: "individual" | "student" | "corporate"; // → membership_type
  price?: number;             // local only (pricing logic), not stored
  paymentMethod?: "stripe" | "emt" | "cash" | "paid"; // → payment_method
  paymentStatus: "pending" | "active" | "failed" | "cancelled"; // → payment_status
  stripeCustomerId?: string;  // → stripe_payment_id
  activatedAt?: string;       // → activated_at
  welcomeSentAt?: string;     // → join_date
  // Directly passed fields
  province?: string;
  phone?: string;
  company?: string;           // → company_name
  jobTitle?: string;          // → job_title
  tradeAffiliation?: string;  // → trade_affiliation
  company_size?: string;
  sector?: string;
  experience_trades?: string;
  referral_source?: string;
  anything_else?: string;
  interested?: string;
  graduation_year?: string;
  school_program?: string;
  mentor_areas?: string;
  mentor_hours?: string;
  ambassador_why?: string;
  ambassador_org?: string;
}

const BASE_URL = process.env.NOCODB_BASE_URL!;
const API_TOKEN = process.env.NOCODB_API_TOKEN!;
const BASE_ID = process.env.NOCODB_BASE_ID!;
const TABLE_ID = process.env.NOCODB_MEMBERS_TABLE_ID!;

function headers() {
  return {
    "xc-token": API_TOKEN,
    "Content-Type": "application/json",
  };
}

function endpoint(path = "") {
  return `${BASE_URL}/api/v1/db/data/noco/${BASE_ID}/${TABLE_ID}${path}`;
}

const TIER_MAP: Record<string, string> = {
  individual: "Individual",
  student: "Student",
  corporate: "Corporate",
};

/** Map a CreateMemberInput to the snake_case payload NocoDB expects. */
function toNocoDBPayload(input: CreateMemberInput): Record<string, unknown> {
  return {
    userId: input.userId,
    full_name: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email,
    phone: input.phone,
    province: input.province,
    membership_type: TIER_MAP[input.tier] ?? input.tier,
    trade_affiliation: input.tradeAffiliation,
    sector: input.sector,
    experience_trades: input.experience_trades,
    job_title: input.jobTitle,
    company_name: input.company,
    company_size: input.company_size,
    school_program: input.school_program,
    graduation_year: input.graduation_year,
    mentor_areas: input.mentor_areas,
    mentor_hours: input.mentor_hours,
    ambassador_why: input.ambassador_why,
    ambassador_org: input.ambassador_org,
    interested: input.interested,
    referral_source: input.referral_source,
    anything_else: input.anything_else,
    payment_status: input.paymentStatus,
    payment_method: input.paymentMethod,
    stripe_payment_id: input.stripeCustomerId,
    activated_at: input.activatedAt,
    join_date: input.welcomeSentAt,
  };
}

export async function createMemberRecord(
  input: CreateMemberInput
): Promise<MemberRecord> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(toNocoDBPayload(input)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NocoDB createMemberRecord failed: ${text}`);
  }
  return res.json();
}

export async function getMemberByUserId(
  userId: string
): Promise<MemberRecord | null> {
  const params = new URLSearchParams({
    where: `(userId,eq,${userId})`,
    limit: "1",
  });
  const res = await fetch(`${endpoint()}?${params}`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const list: MemberRecord[] = data?.list ?? [];
  return list[0] ?? null;
}

export async function getMemberByEmail(
  email: string
): Promise<MemberRecord | null> {
  const params = new URLSearchParams({
    where: `(email,eq,${email})`,
    limit: "1",
  });
  const res = await fetch(`${endpoint()}?${params}`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const list: MemberRecord[] = data?.list ?? [];
  return list[0] ?? null;
}

export async function updateMemberStatus(
  recordId: string,
  payment_status: MemberRecord["payment_status"],
  extra?: Partial<MemberRecord>
): Promise<MemberRecord> {
  const res = await fetch(endpoint(`/${recordId}`), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      payment_status,
      activated_at: new Date().toISOString(),
      ...extra,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NocoDB updateMemberStatus failed: ${text}`);
  }
  return res.json();
}

export interface MemberListResponse {
  list: MemberRecord[];
  pageInfo: { totalRows: number; page: number; pageSize: number };
}

export async function getAllMembers(
  page = 1,
  pageSize = 25,
  search?: string
): Promise<MemberListResponse> {
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    sort: "-createdAt",
  });
  if (search) {
    params.set(
      "where",
      `(email,like,%${search}%)~or(full_name,like,%${search}%)`
    );
  }
  const res = await fetch(`${endpoint()}?${params}`, { headers: headers() });
  if (!res.ok) return { list: [], pageInfo: { totalRows: 0, page, pageSize } };
  const data = await res.json();
  return {
    list: data?.list ?? [],
    pageInfo: {
      totalRows: data?.pageInfo?.totalRows ?? 0,
      page,
      pageSize,
    },
  };
}

export async function getMemberById(
  recordId: string
): Promise<MemberRecord | null> {
  const res = await fetch(endpoint(`/${recordId}`), { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

export async function updateMemberPaymentMethod(
  recordId: string,
  payment_method: MemberRecord["payment_method"]
): Promise<MemberRecord> {
  const res = await fetch(endpoint(`/${recordId}`), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ payment_method }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NocoDB updateMemberPaymentMethod failed: ${text}`);
  }
  return res.json();
}
