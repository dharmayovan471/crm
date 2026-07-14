export interface ApiResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  metadata?: {
    timestamp: string;
    path: string;
    pagination?: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  metadata: {
    timestamp: string;
    path: string;
    requestId: string;
  };
}
