import { Menu } from "lucide-react";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import { useSidebar } from "@/hooks/use-sidebar";

type MobileHeaderProps = {
  toggleSidebar?: () => void;
};

export default function MobileHeader(props: MobileHeaderProps) {
  const sidebarContext = useSidebar();
  const toggleSidebar = props.toggleSidebar || sidebarContext.toggleSidebar;
  return (
    <header className="bg-white shadow-sm p-3 flex justify-between items-center sticky top-0 z-30 md:hidden">
      <button onClick={toggleSidebar} className="p-2 focus:outline-none">
        <Menu className="h-5 w-5" />
      </button>
      
      <div className="flex items-center space-x-1">
        <span className="font-semibold text-gray-800">Health</span>
        <span className="font-semibold text-primary-500">Analytics</span>
      </div>
      
      <NotificationDropdown />
    </header>
  );
}
