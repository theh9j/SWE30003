import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Menu, User, LogOut } from "lucide-react";

export default function TopBar() {
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload(); // refresh page to login
    },
  });

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          <div className="flex items-center space-x-4">
            <Menu className="h-6 w-6 text-gray-500 md:hidden" />
            <span className="text-lg font-semibold text-gray-800">Long Chau Pharmacy</span>
          </div>

          <div className="flex items-center space-x-6">
            <Bell className="h-5 w-5 text-gray-500" />

            {/* User Dropdown Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-400 leading-none">{roleLabel}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {user ? user.username : "Loading..."}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user?.username?.slice(0, 2).toUpperCase() || "LC"}
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={10}
                  align="end"
                  side="left"
                  className="min-w-[160px] rounded-md bg-white shadow-lg border border-gray-100 p-1 z-[100] absolute"
                >
                  <DropdownMenu.Item
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => (window.location.href = "/profile")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                  <DropdownMenu.Item
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </header>
  );
}
