"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const toggleSidebar = React.useCallback(() => {
    setOpen((value) => !value);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggleSidebar,
    }),
    [open, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        data-state={open ? "expanded" : "collapsed"}
        className={cn("flex min-h-dvh w-full bg-background", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  const { open } = useSidebar();

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "group/sidebar sticky top-0 flex h-dvh w-(--layout-sidebar-width) shrink-0 flex-col border-r border-border bg-card text-foreground transition-[width] duration-200 ease-out",
        "data-[state=collapsed]:w-16",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex min-h-14 items-center px-4", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-6 px-3 py-4", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto flex flex-col gap-2 px-3 py-4", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-opacity duration-200",
        "group-data-[state=collapsed]/sidebar:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  className,
  isActive = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        "group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0",
        "group-data-[state=collapsed]/sidebar:[&_span]:sr-only",
        className,
      )}
      {...props}
    />
  );
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={open ? "사이드바 접기" : "사이드바 펼치기"}
      aria-expanded={open}
      className={cn(
        "size-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft className="size-5" aria-hidden="true" />
    </Button>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
