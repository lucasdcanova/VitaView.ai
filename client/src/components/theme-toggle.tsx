import React from 'react';
import { Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Dark mode disabled - this component now just shows light mode indicator
export function ThemeToggle() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-gray-100 cursor-default"
                        disabled
                    >
                        <Sun className="h-4 w-4 text-gray-400" />
                        <span className="sr-only">Tema claro (dark mode desabilitado)</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Modo claro ativo</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
