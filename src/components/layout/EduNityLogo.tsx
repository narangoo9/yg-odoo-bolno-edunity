import { cn } from "@/lib/utils";

interface EduNityLogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  iconOnly?: boolean;
  forDarkBg?: boolean;
}

export function EduNityLogo({
  className,
  textClassName,
  iconClassName,
  iconOnly = false,
  forDarkBg = false,
}: EduNityLogoProps) {
  const logoClassName = cn("h-10 w-auto shrink-0", iconClassName);

  return (
    <div className={cn("flex items-center", iconOnly ? "gap-0" : "gap-3", className)}>
      <div className="relative shrink-0">
        {forDarkBg ? (
          <img
            src="/brand/logo-dark-mode-removebg-preview.png"
            alt="EduNity logo"
            width={161}
            height={125}
            loading="eager"
            decoding="async"
            draggable={false}
            className={logoClassName}
          />
        ) : (
          <>
            <img
              src="/brand/logo-light-mode-removebg-preview.png"
              alt="EduNity logo"
              width={170}
              height={138}
              loading="eager"
              decoding="async"
              draggable={false}
              className={cn(logoClassName, "dark:hidden")}
            />
            <img
              src="/brand/logo-dark-mode-removebg-preview.png"
              alt="EduNity logo"
              width={161}
              height={125}
              loading="eager"
              decoding="async"
              draggable={false}
              className={cn(logoClassName, "hidden dark:block")}
            />
          </>
        )}
      </div>

      {!iconOnly && (
        <span
          className={cn(
            "font-black text-[2rem] leading-none tracking-[-0.06em]",
            forDarkBg ? "text-white" : "text-[#06141B] dark:text-white",
            textClassName,
          )}
        >
          EduNity
        </span>
      )}
    </div>
  );
}
