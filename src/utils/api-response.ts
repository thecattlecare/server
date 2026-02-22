import { IApiResponse } from "./types";

export class ApiResponse {
  static success<T>(message: string, data?: T, pagination?: any): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      pagination
    };
  }

  static error(message: string, error?: any): IApiResponse<null> {
    return {
      success: false,
      message,
      error: error instanceof Error ? error.message : error,
    };
  }
}
