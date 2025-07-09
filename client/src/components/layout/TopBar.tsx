import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export default function TopBar({ title = "Dashboard", subtitle = "Overview of your pharmacy operations" }: TopBarProps) {
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const getUserInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-64 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="ghost" size="icon" className="p-2 text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                {user ? getUserInitials(user.username) : "LC"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">
              {user ? user.username : "Loading..."}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
