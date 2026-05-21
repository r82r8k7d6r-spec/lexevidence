"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserNavProps {
  email: string;
}

export default function UserNav({ email }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 hidden sm:block">{email}</span>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium"
      >
        ログアウト
      </button>
    </div>
  );
}
