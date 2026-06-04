'use client';

interface GreetingProps {
  name: string;
  className?: string;
}

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 4) return { text: 'Begadang ya', emoji: '🌙' };
  if (h < 11) return { text: 'Selamat pagi', emoji: '☀️' };
  if (h < 15) return { text: 'Selamat siang', emoji: '🌤️' };
  if (h < 18) return { text: 'Selamat sore', emoji: '🌅' };
  if (h < 22) return { text: 'Selamat malam', emoji: '🌙' };
  return { text: 'Selamat malam', emoji: '✨' };
}

export function Greeting({ name, className }: GreetingProps) {
  const { text, emoji } = getGreeting();
  const firstName = name.split(/\s+/)[0] || name;
  return (
    <span className={className}>
      {emoji} {text}, <span className="font-display font-bold">{firstName}</span>
    </span>
  );
}
