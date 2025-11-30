export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page doesn't use the admin shell - renders children directly
  return <>{children}</>;
}
