export interface School {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contact: number;
  image?: string;
  email_id: string;
  created_by?: number;
  created_by_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image?: FileList;
}
