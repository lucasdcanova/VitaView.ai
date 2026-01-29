import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export function LandingNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: "demonstracoes", label: "Vita Timeline" },
        { id: "como-funciona", label: "View Laboratorial" },
        { id: "agenda", label: "Agenda" },
        { id: "beneficios", label: "Benefícios" },
        { id: "para-quem", label: "Para Quem" },
        { id: "depoimentos", label: "Depoimentos" }
    ];

    return (
        <>
            <motion.nav
                className="bg-white border-b border-[#E0E0E0] py-3 fixed top-0 left-0 right-0 z-50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <motion.div
                        className="cursor-pointer"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                        <Logo
                            size="md"
                            showText={true}
                            textSize="lg"
                            variant="icon"
                            className="font-bold tracking-tight"
                        />
                    </motion.div>

                    {/* Desktop navigation - design minimalista */}
                    <div className="hidden md:flex space-x-8 text-[#212121]">
                        {navItems.map((item) => (
                            <motion.a
                                key={item.id}
                                href={`#${item.id}`}
                                className="hover:text-[#9E9E9E] transition-colors relative group py-2 text-sm font-body font-medium"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                {item.label}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#212121] group-hover:w-full transition-all duration-300"></span>
                            </motion.a>
                        ))}
                    </div>

                    {/* Mobile hamburger menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        <Link href="/auth">
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-[#212121] hover:bg-[#424242] text-white font-heading font-bold"
                            >
                                Acessar
                            </Button>
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Login/Access button with improved animation */}
                    <motion.div
                        className="hidden md:block"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Link href="/auth">
                            <Button variant="default" className="bg-[#212121] hover:bg-[#424242] text-white px-6 py-2 font-heading font-bold rounded-lg">
                                Acessar <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.nav>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setIsMobileMenuOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Slide-out menu */}
                        <motion.div
                            className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <div className="p-6 pt-20">
                                <nav className="space-y-4">
                                    {navItems.map((item, index) => (
                                        <motion.a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block py-3 px-4 text-[#212121] hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            {item.label}
                                        </motion.a>
                                    ))}
                                </nav>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <Link href="/auth">
                                        <Button className="w-full bg-[#212121] hover:bg-[#424242] text-white font-bold">
                                            Acessar <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
