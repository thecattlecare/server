import { IApiResponse } from "./types";

export class ApiResponse {
  static success<T>(message: string, status: number, data?: T, pagination?: any): IApiResponse<T> {
    return {
      success: true,
      status,
      message,
      data,
      pagination
    };
  }

  static error(message: string, status: number, error?: any): IApiResponse<null> {
    return {
      status,
      success: false,
      message,
      error: error instanceof Error ? error.message : error,
    };
  }
}
