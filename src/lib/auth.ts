export const ADMIN_CREDENTIALS = {
  email: "solfamendez41@gmail.com",
  password: "Solfa11111111@",
  name: "Solfa Mendez",
  role: "superadmin" as const,
  avatar: "SM",
  plan: "Enterprise",
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
