const VOIP_BASE = "https://voip.ms/api/v1/rest.php";

export type VoipApiResponse<T = unknown> = {
  status: string;
  [key: string]: T | string | unknown;
};

export class VoipMsClient {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  async request<T = VoipApiResponse>(
    method: string,
    params: Record<string, string | number | boolean> = {},
  ): Promise<T> {
    const search = new URLSearchParams({
      api_username: this.username,
      api_password: this.password,
      method,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    const url = `${VOIP_BASE}?${search.toString()}`;
    console.log(`[VoipMs] ${method} request`);
    const res = await fetch(url);
    const json = (await res.json()) as VoipApiResponse;
    if (json.status !== "success") {
      const err = (json as { status?: string; message?: string }).message ?? json.status ?? "Unknown Voip.ms error";
      console.error(`[VoipMs] ${method} error:`, err);
      throw new Error(String(err));
    }
    return json as T;
  }

  async getDIDsUSA(state: string, ratecenter: string) {
    return this.request<{ dids?: Array<{ did: string; monthly: string; setup: string; province: string; ratecenter: string }> }>(
      "getDIDsUSA",
      { state, ratecenter },
    );
  }

  async getRateCentersUSA(state: string) {
    return this.request<{ ratecenters?: Array<{ ratecenter: string }> }>(
      "getRateCentersUSA",
      { state },
    );
  }

  async orderDID(did: string, routing = "account:main", billingType = 1, account = "main") {
    return this.request("orderDID", {
      did,
      routing,
      billing_type: billingType,
      account,
      failover_busy: "",
      failover_unreachable: "",
      failover_noanswer: "",
      voicemail: "",
      pop: 0,
      dialtime: 0,
      cnam: 0,
      callerid_prefix: "",
      note: "",
      monthly: "",
      setup: "",
      minute: "",
      test: 0,
    });
  }

  async sendSMS(did: string, dst: string, message: string) {
    return this.request("sendSMS", { did, dst, message });
  }
}

const AREA_CODE_TO_STATE_RATECENTER: Record<string, [string, string]> = {
  "415": ["CA", "SANFRANCISCO"],
  "212": ["NY", "NEWYORK"],
  "310": ["CA", "LOSANGELES"],
  "305": ["FL", "MIAMI"],
  "702": ["NV", "LASVEGAS"],
  "312": ["IL", "CHICAGO"],
  "404": ["GA", "ATLANTA"],
  "713": ["TX", "HOUSTON"],
  "214": ["TX", "DALLAS"],
};

export function resolveAreaCode(areaCode: string): [string, string] | null {
  const n = areaCode.replace(/\D/g, "");
  return AREA_CODE_TO_STATE_RATECENTER[n] ?? null;
}
