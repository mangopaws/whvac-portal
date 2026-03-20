export interface MemberRecord {
  id?: string;
  userId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  tier: "individual" | "student" | "corporate";
  price: number;
  province?: string;
  careerRole?: string;
  paymentMethod?: "stripe" | "emt" | "cash";
  paymentStatus: "pending" | "active" | "failed" | "cancelled";
  stripeCustomerId?: string;
  activatedAt?: string;
  welcomeSentAt?: string;
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

export async function createMemberRecord(
  data: Omit<MemberRecord, "id">
): Promise<MemberRecord> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
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
  paymentStatus: MemberRecord["paymentStatus"],
  extra?: Partial<MemberRecord>
): Promise<MemberRecord> {
  const res = await fetch(endpoint(`/${recordId}`), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ paymentStatus, activatedAt: new Date().toISOString(), ...extra }),
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
    params.set("where", `(email,like,%${search}%)~or(name,like,%${search}%)`);
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
  paymentMethod: MemberRecord["paymentMethod"]
): Promise<MemberRecord> {
  const res = await fetch(endpoint(`/${recordId}`), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ paymentMethod }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NocoDB updateMemberPaymentMethod failed: ${text}`);
  }
  return res.json();
}
