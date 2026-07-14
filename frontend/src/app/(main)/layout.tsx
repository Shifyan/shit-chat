"use client";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/service/auth.service";
import { useRouter } from "next/navigation";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { trigger } = useLogout();

  const handleLogout = async () => {
    try {
      await trigger({ method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <>
      {children}
      <div className="fixed top-0 left-0 z-999999 m-md">
        <Button variant="default" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </>
  );
}
