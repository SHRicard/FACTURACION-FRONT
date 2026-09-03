export type BadgeTone = 'neutral' | 'primary' | 'success' | 'error' | 'warning';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}
