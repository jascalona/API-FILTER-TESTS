export interface FieldInfo {
    name: string;
    label: string;
    supported_operators: string[];
  }
  
  export interface FieldsResponse {
    fields: FieldInfo[];
  }
  
  export interface FilterRule {
    field: string;
    operator: string;
    value: string;
  }
  
  export interface CustomQueryPayload {
    logical_operator: 'AND';
    rules: FilterRule[];
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
  
  export interface TestSuiteParams {
    TRANSACTION_ID?: string;
    TX_LIKE?: string;
    STATUS?: string;
    REJECTED_CODE?: string;
    RJ_CODE_LIKE?: string;
    REF_IBP?: string;
    REF_IBP_LIKE?: string;
    AMOUNT?: string;
    AMOUNT_LIKE?: string;
    AMOUNT_LTE?: string;
    AMOUNT_GTE?: string;
    AMOUNT_BTWN?: string;
    [key: string]: string | undefined;
  }