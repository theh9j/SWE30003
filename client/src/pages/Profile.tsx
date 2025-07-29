import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        window.location.href = "/login"; // ⛔ not logged in
        return null;
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) return <p className="p-4">Loading profile...</p>;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <div className="space-y-4 text-sm">
        <div><strong>Full Name:</strong> {user.full_name}</div>
        <div><strong>Username:</strong> {user.username}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Phone:</strong> {user.phone_number || "N/A"}</div>
        <div><strong>Address:</strong> {user.address || "N/A"}</div>
        <div><strong>Role:</strong> {user.role}</div>
      </div>
    </div>
  );
}
