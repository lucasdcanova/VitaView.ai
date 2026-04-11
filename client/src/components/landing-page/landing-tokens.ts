export const tokens = {
    section: {
        light: "bg-[#FAFAFA]",
        lightAlt: "bg-[#F5F5F5]",
        lightWhite: "bg-white",
        dark: "bg-[#0A0A0A]",
        darkAlt: "bg-[#111111]",
        padding: "py-20 md:py-28",
        paddingFull: "min-h-[100dvh] py-16 md:py-24 flex flex-col justify-center",
    },
    eyebrow: {
        light: "font-heading text-[11px] font-semibold tracking-[0.22em] uppercase text-[#757575]",
        dark: "font-heading text-[11px] font-semibold tracking-[0.22em] uppercase text-white/55",
        lineLight: "h-px w-8 bg-[#212121]/35",
        lineDark: "h-px w-8 bg-white/35",
    },
    h2: {
        light: "font-heading font-bold text-[2rem] md:text-[2.5rem] lg:text-[2.85rem] xl:text-[3.15rem] leading-[1.05] tracking-[-0.02em] text-[#212121]",
        dark: "font-heading font-bold text-[2rem] md:text-[2.5rem] lg:text-[2.85rem] xl:text-[3.15rem] leading-[1.05] tracking-[-0.02em] text-white",
        splitLight: "text-[#9E9E9E] italic font-light",
        splitDark: "text-white/45 italic font-light",
    },
    body: {
        light: "font-body text-[15px] md:text-[17px] leading-relaxed text-[#616161]",
        dark: "font-body text-[15px] md:text-[17px] leading-relaxed text-white/65",
    },
    reveal: {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};
