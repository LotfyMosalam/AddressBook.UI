export interface JobDto {
  id: string;
  name: string;
}

export interface CreateJobRequest {
  name: string;
}

export interface UpdateJobRequest {
  name: string;
}
