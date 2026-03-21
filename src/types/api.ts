export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errorCode?: string | null;
}
