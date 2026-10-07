// Flujo X: Custom Request
export interface Rule {
    id: string;
    field: string;
    operator: string;
    value: string;
  }
  
  export interface CustomFilterResponse {
    condition_generated: string;
    latency_ms: number;
    status_code: number;
    raw_response: any[];
  }
  
  // Flujo Y: Test Suite (Precargados)
  export interface TestGroup {
    id: string;
    name: string;
    description: string;
    count: number;
  }
  
  export interface TestCaseResult {
    id: string;
    name: string;
    condition: string;
    status_code: number;
    latency_ms: number;
    passed: boolean;
    error: string;
  }
  
  export interface TestSuiteResponse {
    total: number;
    results: TestCaseResult[];
  }

  export interface SuiteParams {
    group_id?: string;
    transaction_id: string;
    tx_like: string;
    status: string;
    rejected_code: string;
    rj_code_like: string;
    ref_ibp: string;
    ref_ibp_like: string;
    amount: string;
    amount_like: string;
    amount_lte: string;
    amount_gte: string;
    amount_btwn: string;
  }