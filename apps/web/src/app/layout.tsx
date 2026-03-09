import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoiceCheck — Panel Fonoaudiólogo',
  description: 'Plataforma de revisión de evaluaciones fonológicas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
