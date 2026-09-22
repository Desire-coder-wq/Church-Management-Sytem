export type User = {
  id: string;
  email: string;
  role: string;
  fullName: string;
};
export type Member = {
  id: string;
  fullName: string;
  phone: string;
  group: { name: string };
};
export type Campaign = {
  id: string;
  name: string;
  targetAmount: number;
  status: string;
};
export type Pledge = {
  id: string;
  amount: number;
  paid: number;
  balance: number;
  status: string;
  member: Member;
  campaign: Campaign;
};
