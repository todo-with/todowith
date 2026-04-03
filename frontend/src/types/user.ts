export interface UserProfile {
  id: string;
  name: string;
  email: string;
  can_teach_skills: string[];
  want_to_skills: string[];
  description: string | null;
}
