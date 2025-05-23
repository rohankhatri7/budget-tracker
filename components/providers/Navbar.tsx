"use client"

import React, { useState } from "react"
import Logo, { LogoMobile } from "../Logo"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "../ui/button"
import { UserButton } from "@clerk/nextjs"
import { ThemeSwitcherBtn } from "../ThemeSwitcherBtn"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

//render desktop and mobile nav
function Navbar() {
  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  )
}

const items = [
  { label: "Dashboard", link: "/" },
  { label: "Transactions", link: "/transactions" },
  { label: "Analytics", link: "/history" },
  { label: "Manage", link: "/manage" },
]

//mobile has a slide out menu
function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-8">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[400px] sm:w-[540px]" side="left">
            <SheetHeader>
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            </SheetHeader>

            <Logo />

            <div className="flex flex-col gap-1 pt-4">
              {items.map((item) => (
                <NavbarItem
                  key={item.label}
                  link={item.link}
                  label={item.label}
                  clickCallBack={() => setIsOpen(false)}
                />
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex h-[80px] min-h-[60px] items-center gap-x-4">
          <LogoMobile />
        </div>

        <div className="flex items-center gap-2 pr-12">
          <ThemeSwitcherBtn />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </nav>
    </div>
  )
}

//desktop navbar has links
function DesktopNavbar() {
  return (
    <div className="hidden border-separate border-b bg-background md:block">
      <nav className="flex items-center justify-between">
        <div className="flex h-[80px] min-h-[60px] items-center gap-x-4 px-8">
          <Logo />
          <div className="flex h-full">
            {items.map((item) => (
              <NavbarItem
                key={item.label}
                link={item.link}
                label={item.label}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pr-12">
          <ThemeSwitcherBtn />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </nav>
    </div>
  )
}

function NavbarItem({
  link,
  label,
  clickCallBack,
}: {
  link: string
  label: string
  clickCallBack?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === link

  return (
    <div className="relative flex items-center">
      <Link
        href={link}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "w-full justify-start text-lg text-muted-foreground hover:text-foreground",
          isActive && "text-foreground"
        )}
        onClick={() => {
          if (clickCallBack) clickCallBack()
        }}
      >
        {label}
      </Link>

      {isActive && (
        <div
          className="
            absolute 
            -bottom-[2px] 
            left-1/2 
            hidden 
            h-[2px] 
            w-[80%] 
            -translate-x-1/2 
            rounded-xl 
            bg-foreground 
            md:block
          "
        />
      )}
    </div>
  )
}

export default Navbar
