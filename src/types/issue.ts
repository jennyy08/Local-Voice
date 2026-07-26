export type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  date: string;
  votes: number;
  lat: number;
  lng: number;
  description: string;
  photo?: string;
};
